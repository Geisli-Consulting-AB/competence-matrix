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
} from "docx";
import { getPdfStrings } from "../../i18n";
import type { DocumentExporter, ExportData } from "./types";

/**
 * DOCX document exporter
 * Uses the 'docx' library to generate Microsoft Word documents
 */
export class DocxExporter implements DocumentExporter {
  async generate(data: ExportData): Promise<Blob> {
    const strings = getPdfStrings(data.lang);

    // DOCX uses inverted sidebar (light bg, dark text) for Word compatibility
    // Word ignores white text color on dark backgrounds, so we use readable alternative
    const COLOR = {
      sidebarBg: "E8EEF4", // Light blue-gray for DOCX sidebar
      sidebarText: "1A2B3C", // Dark blue text for sidebar
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
              width: { size: 40, type: WidthType.PERCENTAGE },
              shading: { fill: COLOR.sidebarBg },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 200, bottom: 200, left: 200, right: 200 },
            }),
            new TableCell({
              children: rightColumnContent,
              width: { size: 60, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 200, bottom: 200, left: 200, right: 200 },
            }),
          ],
        }),
      ],
    });

    const sections: (Paragraph | Table)[] = [table];
    sections.push(new Paragraph({ children: [new PageBreak()] }));

    // Experience section
    if (data.experiences && data.experiences.length > 0) {
      sections.push(
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
          spacing: { before: 400, after: 200 },
        })
      );
      data.experiences.forEach((exp) => {
        const period =
          exp.startYear || exp.endYear
            ? `${exp.startYear || ""} - ${exp.endYear || "Present"}`
            : "";
        sections.push(
          new Paragraph({
            children: [
              createBlackText(exp.title, { bold: true }),
              createBlackText(` at ${exp.employer}`),
            ],
            spacing: { after: 100 },
          })
        );
        if (period) {
          sections.push(
            new Paragraph({
              children: [createBlackText(period, { italics: true })],
              spacing: { after: 100 },
            })
          );
        }
        sections.push(
          new Paragraph({
            children: [createBlackText(exp.description)],
            spacing: { after: 200 },
          })
        );
      });
    }

    // Education section
    if (data.educations && data.educations.length > 0) {
      sections.push(
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
          spacing: { before: 400, after: 200 },
        })
      );
      data.educations.forEach((edu) => {
        sections.push(
          new Paragraph({
            children: [createBlackText(edu.degree, { bold: true })],
            spacing: { after: 100 },
          })
        );
        sections.push(
          new Paragraph({
            children: [
              createBlackText(
                `${edu.school} (${edu.startYear} - ${
                  edu.ongoing ? "Ongoing" : edu.endYear
                })`
              ),
            ],
            spacing: { after: 200 },
          })
        );
      });
    }

    // Courses section
    if (data.courses && data.courses.length > 0) {
      sections.push(
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
        })
      );
      data.courses.forEach((course) => {
        const parts = [course.name];
        if (course.issuer) parts.push(` - ${course.issuer}`);
        if (course.year) parts.push(` (${course.year})`);
        sections.push(
          new Paragraph({
            children: [createBlackText(`• ${parts.join("")}`)],
            spacing: { after: 100 },
          })
        );
      });
    }

    // Engagements section
    if (
      data.engagementsPublications &&
      data.engagementsPublications.length > 0
    ) {
      sections.push(
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
        })
      );
      data.engagementsPublications.forEach((item) => {
        sections.push(
          new Paragraph({
            children: [createBlackText(item.title, { bold: true })],
            spacing: { after: 100 },
          })
        );
        const details: string[] = [];
        if (item.year) details.push(item.year);
        if (item.locationOrPublication)
          details.push(item.locationOrPublication);
        if (details.length > 0) {
          sections.push(
            new Paragraph({
              children: [
                createBlackText(details.join(" - "), { italics: true }),
              ],
              spacing: { after: 100 },
            })
          );
        }
        if (item.description) {
          sections.push(
            new Paragraph({
              children: [createBlackText(item.description)],
              spacing: { after: 200 },
            })
          );
        }
      });
    }

    // Competences section
    if (data.competences && data.competences.length > 0) {
      sections.push(
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
          spacing: { before: 400, after: 200 },
        })
      );
      data.competences.forEach((category) => {
        sections.push(
          new Paragraph({
            children: [createBlackText(category.category, { bold: true })],
            spacing: { after: 100 },
          })
        );
        category.items.forEach((item) => {
          sections.push(
            new Paragraph({
              children: [createBlackText(`• ${item.name}`)],
              spacing: { after: 100 },
            })
          );
        });
      });
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0.5),
                bottom: convertInchesToTwip(0.5),
                left: convertInchesToTwip(0.5),
                right: convertInchesToTwip(0.5),
              },
            },
          },
          children: sections,
        },
      ],
    });

    return await Packer.toBlob(doc);
  }
}
