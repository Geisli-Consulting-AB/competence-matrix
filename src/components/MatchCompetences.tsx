import React, {useState, useRef, useEffect} from "react";
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from "jszip";
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Stack,
    Divider,
    Chip,
    CircularProgress,
    Alert,
    List,
    ListItem,
    LinearProgress,
    Tooltip,
} from "@mui/material";

// Initialize pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import PersonIcon from "@mui/icons-material/Person";
import {extractCompetences, matchCompetencesFuzzy} from "../services/competenceExtractionService";
import {getAllUsersCompetences, getAllCompetencesForAutocomplete} from "../firebase";

interface UserMatch {
    userId: string;
    ownerName: string;
    score: number;
    matchedCompetences: { name: string; level: number }[];
}

const MatchCompetences: React.FC = () => {
    const [jobDescription, setJobDescription] = useState("");
    const [extractedCompetences, setExtractedCompetences] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [allUsersData, setAllUsersData] = useState<{
        userId: string;
        ownerName: string;
        competences: { name: string; level: number }[]
    }[]>([]);
    const [existingCompetenceNames, setExistingCompetenceNames] = useState<string[]>([]);
    const [userMatches, setUserMatches] = useState<UserMatch[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [data, names] = await Promise.all([
                    getAllUsersCompetences(),
                    getAllCompetencesForAutocomplete()
                ]);
                setAllUsersData(data.users.map(u => ({
                    userId: u.userId,
                    ownerName: u.ownerName,
                    competences: u.competences.map(c => ({name: c.name, level: c.level}))
                })));
                setExistingCompetenceNames(names);
            } catch (err) {
                console.error("Failed to fetch matching data:", err);
            }
        };
        fetchData();
    }, []);

    const handleMatch = async (textToMatch: string = jobDescription, extracted: string[] = extractedCompetences) => {
        if (!textToMatch && extracted.length === 0) return;

        setLoading(true);
        setLoadingStatus("Matching competences...");
        const textLower = textToMatch.toLowerCase();

        try {
            let fuzzyMapping: Record<string, string[]> = {};

            // Try AI fuzzy matching if we have extracted competences
            if (extracted.length > 0 && existingCompetenceNames.length > 0) {
                try {
                    fuzzyMapping = await matchCompetencesFuzzy(extracted, existingCompetenceNames);
                } catch (err) {
                    console.error("Fuzzy matching AI failed, falling back to basic matching", err);
                }
            }

            // All users matches
            if (extracted.length > 0) {
                const calculatedUserMatches: UserMatch[] = allUsersData.map(user => {
                    const matched: { name: string; level: number }[] = [];

                    let satisfiedCount = 0;
                    extracted.forEach(req => {
                        let reqSatisfied = false;
                        // 1. Check AI fuzzy mapping first
                        const aiMatches = fuzzyMapping[req] || [];
                        if (aiMatches.length > 0) {
                            aiMatches.forEach(matchName => {
                                const userComp = user.competences.find(c => c.name === matchName);
                                if (userComp) {
                                    reqSatisfied = true;
                                    if (!matched.some(m => m.name === userComp.name)) {
                                        matched.push(userComp);
                                    }
                                }
                            });
                        }

                        // 2. Fallback to basic matching if no AI matches or to be safe
                        const reqLower = req.toLowerCase();
                        const userComp = user.competences.find(c => {
                            const cName = c.name.toLowerCase();
                            return cName === reqLower ||
                                reqLower === cName ||
                                (cName.length > 2 && reqLower.includes(cName)) ||
                                (reqLower.length > 2 && cName.includes(reqLower));
                        });

                        if (userComp) {
                            reqSatisfied = true;
                            // Only add if not already in the matched list to avoid duplicates
                            if (!matched.some(m => m.name === userComp.name)) {
                                matched.push(userComp);
                            }
                        }

                        if (reqSatisfied) {
                            satisfiedCount++;
                        }
                    });

                    // Score: percentage of satisfied requirements
                    const score = extracted.length > 0 ? (satisfiedCount / extracted.length) * 100 : 0;

                    return {
                        userId: user.userId,
                        ownerName: user.ownerName,
                        score,
                        matchedCompetences: matched
                    };
                });

                setUserMatches(calculatedUserMatches.sort((a, b) => b.score - a.score));
            } else if (textLower) {
                // Fallback matching if no extracted competences but we have text
                const calculatedUserMatches: UserMatch[] = allUsersData.map(user => {
                    const matched = user.competences.filter(c => textLower.includes(c.name.toLowerCase()));

                    // For fallback, score is less meaningful but we can use number of matches
                    return {
                        userId: user.userId,
                        ownerName: user.ownerName,
                        score: matched.length > 0 ? (matched.length / user.competences.length) * 10 : 0, // Very rough score
                        matchedCompetences: matched
                    };
                });
                setUserMatches(calculatedUserMatches.sort((a, b) => b.score - a.score).filter(u => u.matchedCompetences.length > 0));
            }
        } finally {
            setLoading(false);
            setLoadingStatus(null);
        }
    };

    const handleAIParse = async (text: string) => {
        if (!text) return;
        setLoading(true);
        setLoadingStatus("Analyzing text...");
        setError(null);
        try {
            const extracted = await extractCompetences(text);
            setExtractedCompetences(extracted);
            await handleMatch(text, extracted);
        } catch (err) {
            setError("Failed to extract competences using AI. You can still use manual matching.");
            console.error(err);
            setLoading(false);
            setLoadingStatus(null);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                setJobDescription(text);
                // Automatically trigger AI parse when file is uploaded
                await handleAIParse(text);
            };
            reader.readAsText(file);
        } else if (file.type === "application/pdf") {
            setLoading(true);
            setLoadingStatus("Extracting text from PDF...");
            try {
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
                const pdf = await loadingTask.promise;
                let fullText = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items
                        .map((item) => {
                            if ('str' in item) return (item as { str: string }).str;
                            return '';
                        })
                        .join(" ");
                    fullText += pageText + "\n";
                }

                setJobDescription(fullText);
                await handleAIParse(fullText);
            } catch (err) {
                console.error("Error reading PDF:", err);
                setError("Failed to read PDF file. Please try a different file or copy-paste the text.");
                setLoading(false);
                setLoadingStatus(null);
            }
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith(".docx")) {
            setLoading(true);
            setLoadingStatus("Extracting text from DOCX...");
            try {
                const arrayBuffer = await file.arrayBuffer();
                const zip = await JSZip.loadAsync(arrayBuffer);
                const content = await zip.file("word/document.xml")?.async("string");
                
                if (content) {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(content, "application/xml");
                    const textNodes = xmlDoc.getElementsByTagName("w:t");
                    let fullText = "";
                    for (let i = 0; i < textNodes.length; i++) {
                        fullText += textNodes[i].textContent + " ";
                    }
                    setJobDescription(fullText.trim());
                    await handleAIParse(fullText.trim());
                } else {
                    throw new Error("Could not find word/document.xml in the DOCX file.");
                }
            } catch (err) {
                console.error("Error reading DOCX:", err);
                setError("Failed to read DOCX file. Please try a different file or copy-paste the text.");
                setLoading(false);
                setLoadingStatus(null);
            }
        } else {
            alert("Currently only .txt, .pdf and .docx files are supported for upload.");
        }
    };

    const handleClear = () => {
        setJobDescription("");
        setExtractedCompetences([]);
        setUserMatches([]);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <Box sx={{p: 2}}>
            <Typography variant="h5" gutterBottom>
                Match Competences
            </Typography>
            <Typography variant="body1" sx={{mb: 3}}>
                Paste a job description or upload a text/pdf/docx file to match requirements
                to team user competences.
            </Typography>

            <Stack spacing={3}>
                <Box sx={{display: "flex", gap: 2, alignItems: "center"}}>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUploadIcon/>}
                        disabled={loading}
                    >
                        Upload File
                        <input
                            type="file"
                            hidden
                            accept=".txt,.pdf,.docx"
                            onChange={handleFileUpload}
                            ref={fileInputRef}
                        />
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <AutoFixHighIcon/>}
                        onClick={() => handleAIParse(jobDescription)}
                        disabled={!jobDescription || loading}
                    >
                        AI Extract
                    </Button>
                    <Button
                        variant="text"
                        color="inherit"
                        onClick={handleClear}
                        disabled={(!jobDescription && userMatches.length === 0 && extractedCompetences.length === 0) || loading}
                    >
                        Clear
                    </Button>
                    {loading && loadingStatus && (
                        <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                            <Typography variant="body2" color="text.secondary">
                                {loadingStatus}
                            </Typography>
                        </Box>
                    )}
                    {!loading && (
                        <Typography variant="caption" color="text.secondary">
                            Supported formats: .txt, .pdf, .docx
                        </Typography>
                    )}
                </Box>

                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                    label="Job Description"
                    multiline
                    rows={10}
                    fullWidth
                    variant="outlined"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    disabled={loading}
                />

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleMatch()}
                    disabled={!jobDescription || loading}
                    sx={{alignSelf: "flex-start", minWidth: 150}}
                    startIcon={loading && loadingStatus === "Matching competences..." ?
                        <CircularProgress size={20} color="inherit"/> : null}
                >
                    {loading && loadingStatus === "Matching competences..." ? "Matching..." : "Analyze Match"}
                </Button>

                {extractedCompetences.length > 0 && (
                    <Paper elevation={1} sx={{p: 2, bgcolor: "background.paper"}}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            AI Extracted Competences ({extractedCompetences.length})
                        </Typography>
                        <Box sx={{display: "flex", flexWrap: "wrap", gap: 0.5}}>
                            {extractedCompetences.map((comp, idx) => (
                                <Chip key={idx} label={comp} size="small" variant="outlined"/>
                            ))}
                        </Box>
                    </Paper>
                )}


                {userMatches.length > 0 && (
                    <Box sx={{mt: 4}}>
                        <Typography variant="h6" gutterBottom>
                            Team Matching Results
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                            Users ranked by matching grade based on extracted competences.
                        </Typography>
                        <List sx={{width: '100%', bgcolor: 'background.paper', borderRadius: 1}}>
                            {userMatches.map((userMatch) => (
                                <React.Fragment key={userMatch.userId}>
                                    <ListItem alignItems="flex-start" sx={{flexDirection: 'column', gap: 1, py: 2}}>
                                        <Box sx={{
                                            display: 'flex',
                                            width: '100%',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                <PersonIcon color="primary"/>
                                                <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                                                    {userMatch.ownerName}
                                                </Typography>
                                            </Box>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Match Grade:
                                                </Typography>
                                                <Typography variant="h6" color="primary.main" sx={{fontWeight: 'bold'}}>
                                                    {Math.round(userMatch.score)}%
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{width: '100%', mb: 1}}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={userMatch.score}
                                                sx={{height: 8, borderRadius: 4}}
                                            />
                                        </Box>

                                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                                            {userMatch.matchedCompetences.map((c, i) => (
                                                <Tooltip key={i} title={`Level ${c.level}`}>
                                                    <Chip
                                                        label={c.name}
                                                        size="small"
                                                        color="success"
                                                        variant="outlined"
                                                    />
                                                </Tooltip>
                                            ))}
                                        </Box>
                                    </ListItem>
                                    <Divider component="li"/>
                                </React.Fragment>
                            ))}
                        </List>
                    </Box>
                )}

                {jobDescription && userMatches.length === 0 && !loading && (
                    <Typography color="text.secondary" sx={{mt: 2, fontStyle: "italic"}}>
                        No matching competences found in the team for this text. Try a different job description.
                    </Typography>
                )}
            </Stack>
        </Box>
    );
};

export default MatchCompetences;
