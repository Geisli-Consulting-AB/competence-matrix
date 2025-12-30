import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  BorderStyle,
  TableLayoutType,
  PageBreak,
  convertInchesToTwip,
  ImageRun,
  AlignmentType,
} from "docx";
import { getPdfStrings } from "../../i18n";
import {
  convertUrlToDataUrl,
  circleCropToPng,
  loadImage,
} from "../../pdf/shared";
import type { DocumentExporter, ExportData } from "./types";

/**
 * Create a circular avatar image with a border ring, matching the PDF appearance.
 * Returns a PNG data URL with the circular image and border.
 */
async function createCircularAvatarWithBorder(
  dataUrl: string,
  imageDiameter: number,
  borderWidth: number,
  borderColor: string // hex color like "3E4D69"
): Promise<string> {
  // Total size including border
  const totalSize = imageDiameter + borderWidth * 2;

  // First, crop the image to a circle
  const circularImage = await circleCropToPng(dataUrl, imageDiameter);
  const img = await loadImage(circularImage);

  // Create canvas for the final image with border
  const canvas = document.createElement("canvas");
  canvas.width = totalSize;
  canvas.height = totalSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return circularImage;

  const centerX = totalSize / 2;
  const centerY = totalSize / 2;
  const outerRadius = totalSize / 2;
  const innerRadius = imageDiameter / 2;

  // Draw the border ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true); // counter-clockwise for hole
  ctx.closePath();
  ctx.fillStyle = `#${borderColor}`;
  ctx.fill();

  // Draw the circular image in the center
  ctx.drawImage(img, borderWidth, borderWidth, imageDiameter, imageDiameter);

  return canvas.toDataURL("image/png");
}

/**
 * DOCX document exporter
 * Uses the 'docx' library to generate Microsoft Word documents
 */
export class DocxExporter implements DocumentExporter {
  async generate(data: ExportData): Promise<Blob> {
    const strings = getPdfStrings(data.lang);

    // Convert photo URL to data URL if needed (for Firebase Storage URLs)
    // This matches the PDF exporter's behavior
    let photoDataUrl = data.photoDataUrl;
    if (photoDataUrl && !photoDataUrl.startsWith("data:")) {
      try {
        photoDataUrl = await convertUrlToDataUrl(photoDataUrl);
      } catch (error) {
        console.error("[DOCX] Failed to convert photo URL to data URL:", error);
        photoDataUrl = undefined;
      }
    }

    // DOCX uses inverted sidebar (light bg, dark text) for Word compatibility
    // Word ignores white text color on dark backgrounds, so we use readable alternative
    const COLOR = {
      sidebarBg: "101b29", // Light blue-gray for DOCX sidebar
      sidebarText: "F5F5F5", // Dark blue text for sidebar
      sidebarBorder: "B8C8D8", // Light border for sidebar headings
      white: "FFFFFF",
      black: "000000",
      grayTitle: "666666",
      grayLine: "D9D9D9",
    } as const;

    const FONT_SIZE = {
      title: 48,
      subtitle: 32,
      section: 28,
      body: 24,
    } as const;

    // Helper to create sidebar text (dark text on light background for Word compatibility)
    const createSidebarText = (
      text: string,
      opts?: { bold?: boolean; size?: number }
    ) =>
      new TextRun({
        text,
        bold: opts?.bold ?? false,
        size: opts?.size ?? FONT_SIZE.body,
        color: COLOR.sidebarText,
        font: "Calibri",
      });

    const createBlackText = (
      text: string,
      opts?: {
        bold?: boolean;
        size?: number;
        italics?: boolean;
        color?: string;
      }
    ) =>
      new TextRun({
        text,
        bold: opts?.bold ?? false,
        italics: opts?.italics ?? false,
        size: opts?.size ?? FONT_SIZE.body,
        color: opts?.color ?? COLOR.black,
        font: "Calibri",
      });

    // LEFT COLUMN CONTENT (Dark sidebar)
    const leftColumnContent: Paragraph[] = [];

    // Avatar/Profile Picture (circular with border, matching PDF)
    if (photoDataUrl && photoDataUrl.startsWith("data:image")) {
      try {
        // Avatar dimensions matching PDF (see avatar.ts)
        const imageDiameter = 140; // Inner image diameter
        const borderWidth = 10; // Border thickness (PDF uses lineWidth 20 at different scale)
        const totalSize = imageDiameter + borderWidth * 2;

        // Create circular avatar with border ring
        const circularAvatarDataUrl = await createCircularAvatarWithBorder(
          photoDataUrl,
          imageDiameter,
          borderWidth,
          "3E4D69" // Border color matching PDF: #3e4d69
        );

        // Extract base64 from the processed PNG
        const base64Match = circularAvatarDataUrl.match(
          /^data:image\/png;base64,(.+)$/
        );
        if (base64Match) {
          const base64Data = base64Match[1];

          leftColumnContent.push(
            new Paragraph({
              children: [
                new ImageRun({
                  type: "png",
                  data: Uint8Array.from(atob(base64Data), (c) =>
                    c.charCodeAt(0)
                  ),
                  transformation: {
                    width: totalSize,
                    height: totalSize,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 300 },
            })
          );
        }
      } catch (error) {
        console.error("[DOCX] Failed to create circular avatar:", error);
        // Skip avatar on error
      }
    }

    // Contact Section
    leftColumnContent.push(
      new Paragraph({
        children: [
          createSidebarText(strings.contactTitle, {
            bold: true,
            size: FONT_SIZE.section,
          }),
        ],
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 6,
            color: COLOR.sidebarBorder,
          },
        },
        spacing: { before: 200, after: 200 },
      })
    );
    leftColumnContent.push(
      new Paragraph({
        children: [createSidebarText("sale@geisli.se")],
        spacing: { after: 100 },
      })
    );
    leftColumnContent.push(
      new Paragraph({
        children: [createSidebarText("076-810 17 22")],
        spacing: { after: 100 },
      })
    );
    leftColumnContent.push(
      new Paragraph({
        children: [createSidebarText("Tegnérgatan 34, Stockholm")],
        spacing: { after: 100 },
      })
    );
    leftColumnContent.push(
      new Paragraph({
        children: [createSidebarText("geisli.se")],
        spacing: { after: 300 },
      })
    );

    // Roles
    if (data.roles && data.roles.length > 0) {
      leftColumnContent.push(
        new Paragraph({
          children: [
            createSidebarText(strings.rolesTitle, {
              bold: true,
              size: FONT_SIZE.section,
            }),
          ],
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: COLOR.sidebarBorder,
            },
          },
          spacing: { before: 200, after: 200 },
        })
      );
      data.roles.forEach((role) => {
        leftColumnContent.push(
          new Paragraph({
            children: [createSidebarText(`• ${role}`)],
            spacing: { after: 100 },
          })
        );
      });
    }

    // Expertise
    if (data.expertise && data.expertise.length > 0) {
      leftColumnContent.push(
        new Paragraph({
          children: [
            createSidebarText(strings.expertiseTitle, {
              bold: true,
              size: FONT_SIZE.section,
            }),
          ],
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: COLOR.sidebarBorder,
            },
          },
          spacing: { before: 200, after: 200 },
        })
      );
      data.expertise.forEach((exp) => {
        leftColumnContent.push(
          new Paragraph({
            children: [createSidebarText(`• ${exp}`)],
            spacing: { after: 100 },
          })
        );
      });
    }

    // Languages
    if (data.languages && data.languages.length > 0) {
      leftColumnContent.push(
        new Paragraph({
          children: [
            createSidebarText(strings.languagesTitle, {
              bold: true,
              size: FONT_SIZE.section,
            }),
          ],
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: COLOR.sidebarBorder,
            },
          },
          spacing: { before: 200, after: 200 },
        })
      );
      data.languages.forEach((lang) => {
        leftColumnContent.push(
          new Paragraph({
            children: [createSidebarText(`• ${lang}`)],
            spacing: { after: 100 },
          })
        );
      });
    }

    // Wrap left column content in a nested table for indentation
    const leftColumnNestedTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: leftColumnContent,
              width: { size: 100, type: WidthType.PERCENTAGE },
              margins: { top: 720, bottom: 0, left: 400, right: 0 },
            }),
          ],
        }),
      ],
    });

    // RIGHT COLUMN CONTENT (Main content area)
    const rightColumnContent: Paragraph[] = [];

    // Name at top
    if (data.name) {
      rightColumnContent.push(
        new Paragraph({
          children: [
            createBlackText(data.name, { bold: true, size: FONT_SIZE.title }),
          ],
          spacing: { before: 400, after: 200 },
        })
      );
    }

    // Title/Role below name
    if (data.title) {
      rightColumnContent.push(
        new Paragraph({
          children: [
            createBlackText(data.title, {
              size: FONT_SIZE.subtitle,
              color: COLOR.grayTitle,
            }),
          ],
          spacing: { after: 400 },
        })
      );
    }

    // Summary
    if (data.description) {
      rightColumnContent.push(
        new Paragraph({
          children: [
            createBlackText(strings.summary, {
              bold: true,
              size: FONT_SIZE.section,
            }),
          ],
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: COLOR.grayLine,
            },
          },
          spacing: { before: 200, after: 200 },
        })
      );
      rightColumnContent.push(
        new Paragraph({
          children: [createBlackText(data.description)],
          spacing: { after: 300 },
        })
      );
    }

    // Selected Projects
    if (data.selectedProjects && data.selectedProjects.length > 0) {
      rightColumnContent.push(
        new Paragraph({
          children: [
            createBlackText(strings.selectedProjectsTitle, {
              bold: true,
              size: FONT_SIZE.section,
            }),
          ],
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: COLOR.grayLine,
            },
          },
          spacing: { before: 200, after: 200 },
        })
      );
      data.selectedProjects.forEach((project) => {
        rightColumnContent.push(
          new Paragraph({
            children: [
              createBlackText(`${project.customer} - ${project.title}`, {
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          })
        );
        rightColumnContent.push(
          new Paragraph({
            children: [createBlackText(project.description)],
            spacing: { after: 200 },
          })
        );
      });
    }

    // CREATE TWO-COLUMN TABLE
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      indent: {
        size: 0,
        type: WidthType.DXA,
      },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          height: {
            // US Letter page is 11 inches tall, with 0 top/bottom margins
            value: convertInchesToTwip(11.5),
            rule: "exact",
          },
          children: [
            new TableCell({
              children: [leftColumnNestedTable],
              width: { size: 40, type: WidthType.PERCENTAGE },
              shading: { fill: COLOR.sidebarBg },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 0, left: 0, right: 200 },
            }),
            new TableCell({
              children: rightColumnContent,
              width: { size: 60, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 720, bottom: 720, left: 200, right: 200 },
            }),
          ],
        }),
      ],
    });

    // All content in one section
    const allContent: (Paragraph | Table)[] = [table];

    // Add page break before Experience section
    allContent.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    // Add empty paragraph for top margin on page 2
    allContent.push(
      new Paragraph({
        children: [new TextRun({ text: "" })],
        spacing: { before: 1440 },
      })
    );

    // Experience section
    if (data.experiences && data.experiences.length > 0) {
      allContent.push(
        new Paragraph({
          children: [
            createBlackText(strings.experienceTitle, {
              bold: true,
              size: FONT_SIZE.title,
            }),
          ],
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: COLOR.grayLine,
            },
          },
          spacing: { before: 0, after: 200 },
          indent: { left: 720 },
        })
      );
      data.experiences.forEach((exp) => {
        const period =
          exp.startYear || exp.endYear
            ? `${exp.startYear || ""} - ${exp.endYear || "Present"}`
            : "";
        allContent.push(
          new Paragraph({
            children: [
              createBlackText(exp.title, { bold: true }),
              createBlackText(` at ${exp.employer}`),
            ],
            spacing: { after: 100 },
            indent: { left: 720 },
          })
        );
        if (period) {
          allContent.push(
            new Paragraph({
              children: [createBlackText(period, { italics: true })],
              spacing: { after: 100 },
              indent: { left: 720 },
            })
          );
        }
        allContent.push(
          new Paragraph({
            children: [createBlackText(exp.description)],
            spacing: { after: 200 },
            indent: { left: 720 },
          })
        );
      });
    }

    // Add page break before Education section
    allContent.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    // Add empty paragraph for top margin on page 3
    allContent.push(
      new Paragraph({
        children: [new TextRun({ text: "" })],
        spacing: { before: 1440 },
      })
    );

    // Education section
    if (data.educations && data.educations.length > 0) {
      allContent.push(
        new Paragraph({
          children: [
            createBlackText(strings.educationTitle, {
              bold: true,
              size: FONT_SIZE.title,
            }),
          ],
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: COLOR.grayLine,
            },
          },
          spacing: { before: 0, after: 200 },
          indent: { left: 720 },
        })
      );
      data.educations.forEach((edu) => {
        allContent.push(
          new Paragraph({
            children: [createBlackText(edu.degree, { bold: true })],
            spacing: { after: 100 },
            indent: { left: 720 },
          })
        );
        allContent.push(
          new Paragraph({
            children: [
              createBlackText(
                `${edu.school} (${edu.startYear} - ${
                  edu.ongoing ? "Ongoing" : edu.endYear
                })`
              ),
            ],
            spacing: { after: 200 },
            indent: { left: 720 },
          })
        );
      });
    }

    // Courses section
    if (data.courses && data.courses.length > 0) {
      allContent.push(
        new Paragraph({
          children: [
            createBlackText(strings.coursesTitle, {
              bold: true,
              size: FONT_SIZE.title,
            }),
          ],
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: COLOR.grayLine,
            },
          },
          spacing: { before: 400, after: 200 },
          indent: { left: 720 },
        })
      );
      data.courses.forEach((course) => {
        const parts = [course.name];
        if (course.issuer) parts.push(` - ${course.issuer}`);
        if (course.year) parts.push(` (${course.year})`);
        allContent.push(
          new Paragraph({
            children: [createBlackText(`• ${parts.join("")}`)],
            spacing: { after: 100 },
            indent: { left: 720 },
          })
        );
      });
    }

    // Engagements section
    if (
      data.engagementsPublications &&
      data.engagementsPublications.length > 0
    ) {
      allContent.push(
        new Paragraph({
          children: [
            createBlackText(strings.engagementsPublicationsTitle, {
              bold: true,
              size: FONT_SIZE.title,
            }),
          ],
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: COLOR.grayLine,
            },
          },
          spacing: { before: 400, after: 200 },
          indent: { left: 720 },
        })
      );
      data.engagementsPublications.forEach((item) => {
        allContent.push(
          new Paragraph({
            children: [createBlackText(item.title, { bold: true })],
            spacing: { after: 100 },
            indent: { left: 720 },
          })
        );
        const details: string[] = [];
        if (item.year) details.push(item.year);
        if (item.locationOrPublication)
          details.push(item.locationOrPublication);
        if (details.length > 0) {
          allContent.push(
            new Paragraph({
              children: [
                createBlackText(details.join(" - "), { italics: true }),
              ],
              spacing: { after: 100 },
              indent: { left: 720 },
            })
          );
        }
        if (item.description) {
          allContent.push(
            new Paragraph({
              children: [createBlackText(item.description)],
              spacing: { after: 200 },
              indent: { left: 720 },
            })
          );
        }
      });
    }

    // Add page break before Competences section
    allContent.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    // Add empty paragraph for top margin on page 4
    allContent.push(
      new Paragraph({
        children: [new TextRun({ text: "" })],
        spacing: { before: 1440 },
      })
    );

    // Competences section
    if (data.competences && data.competences.length > 0) {
      allContent.push(
        new Paragraph({
          children: [
            createBlackText(strings.competencesTitle, {
              bold: true,
              size: FONT_SIZE.title,
            }),
          ],
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: COLOR.grayLine,
            },
          },
          spacing: { before: 0, after: 200 },
          indent: { left: 720 },
        })
      );
      data.competences.forEach((category) => {
        allContent.push(
          new Paragraph({
            children: [createBlackText(category.category, { bold: true })],
            spacing: { after: 100 },
            indent: { left: 720 },
          })
        );
        category.items.forEach((item) => {
          allContent.push(
            new Paragraph({
              children: [createBlackText(`• ${item.name}`)],
              spacing: { after: 100 },
              indent: { left: 720 },
            })
          );
        });
      });
    }

    // Create document with single section
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0),
                bottom: convertInchesToTwip(0),
                left: convertInchesToTwip(0),
                right: convertInchesToTwip(0.5),
              },
            },
          },
          children: allContent,
        },
      ],
    });

    return await Packer.toBlob(doc);
  }
}
