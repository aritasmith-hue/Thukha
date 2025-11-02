import { ParsedReport } from '../types';

declare const docx: any;
declare const saveAs: any;

const parseMarkdown = (markdown: string): ParsedReport => {
    const sections: { title: string; content: string }[] = [];
    const lines = markdown.split('\n');
    let currentSection: { title: string; content: string } | null = null;
    let patientId = '';

    for (const line of lines) {
        if (line.startsWith('## ')) {
            if (currentSection) {
                sections.push(currentSection);
            }
            currentSection = { title: line.substring(3).trim(), content: '' };
        } else {
            if (currentSection) {
                currentSection.content += line + '\n';
            }
        }

        if (line.startsWith('**Patient ID:**')) {
            patientId = line.split('**Patient ID:**')[1].trim();
        }
    }
    if (currentSection) {
        sections.push(currentSection);
    }
    return { patientId, sections };
};

export const exportReportAsDocx = async (reportMarkdown: string, patientId: string) => {
    try {
        const { sections } = parseMarkdown(reportMarkdown);

        const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = docx;

        const children: any[] = [];

        sections.forEach(section => {
            children.push(new Paragraph({
                text: section.title,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
            }));

            const lines = section.content.trim().split('\n');
            const separatorIndex = lines.findIndex(line => line.trim().match(/^\|.*-.*\|/));

            if (separatorIndex > 0) { // Found a valid table with a header.
                const tableRows: any[] = [];
                
                // Header Row
                const headerCells = lines[separatorIndex - 1].split('|').map(h => h.trim()).slice(1, -1);
                tableRows.push(new TableRow({
                    children: headerCells.map(header => new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
                        borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
                        shading: { fill: "F2F2F2" },
                    })),
                    tableHeader: true,
                }));

                // Data Rows
                for (let i = separatorIndex + 1; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.trim().startsWith('|')) {
                        const dataCells = line.split('|').map(c => c.trim()).slice(1, -1);
                        tableRows.push(new TableRow({
                            children: dataCells.map(cell => new TableCell({
                                children: [new Paragraph(cell)],
                                borders: { top: { style: BorderStyle.SINGLE }, bottom: { style: BorderStyle.SINGLE }, left: { style: BorderStyle.SINGLE }, right: { style: BorderStyle.SINGLE } },
                            })),
                        }));
                    }
                }

                if (tableRows.length > 0) {
                    const table = new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE },
                    });
                    children.push(table);
                }
            } else { // Not a table, or malformed. Treat as regular text.
                 lines.forEach(line => {
                    if (line.trim() === '') return;
                    if (line.startsWith('**') && line.includes(':**')) {
                        const parts = line.split(':**');
                        children.push(new Paragraph({
                            children: [
                                new TextRun({ text: `${parts[0].replace(/\*\*/g, '').trim()}: `, bold: true }),
                                new TextRun(parts[1].trim()),
                            ],
                        }));
                    } else if (line.startsWith('- ')) {
                        children.push(new Paragraph({
                            text: line.substring(2),
                            bullet: { level: 0 },
                        }));
                    } else {
                        children.push(new Paragraph(line));
                    }
                });
            }
        });


        const doc = new Document({
            sections: [{
                headers: {
                    default: new docx.Header({
                        children: [new Paragraph("Thukha Medical Center (Advanced Natural Health Care Center)"), new Paragraph("GP Consultation & Diagnostic Report – Yangon, Myanmar")],
                    }),
                },
                footers: {
                    default: new docx.Footer({
                        children: [new Paragraph("© Thukha Medical Center (Advanced Natural Health Care Center) – Yangon, Myanmar")],
                    }),
                },
                children: children,
            }],
        });
        
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Thukha_Medical_Center_GP_Report_${patientId}.docx`);
    } catch (error) {
        console.error("Failed to generate DOCX file:", error);
        alert("Sorry, there was an error creating the Word document. Please check the console for details.");
    }
};