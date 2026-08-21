const { GoogleGenAI, Type } = require("@google/genai");
const { z } = require("zod");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

// ============================================================
// ZOD VALIDATION SCHEMA
// ============================================================

const interviewReportSchema = z.object({
    title: z.string(),

    matchScore: z
        .number()
        .min(0)
        .max(100),

    technicalQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string()
        })
    ),

    behavioralQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string()
        })
    ),

    skillGaps: z.array(
        z.object({
            skill: z.string(),
            severity: z.enum([
                "low",
                "medium",
                "high"
            ])
        })
    ),

    preparationPlan: z.array(
        z.object({
            day: z.number().int().positive(),
            focus: z.string(),
            tasks: z.array(z.string())
        })
    )
});

// ============================================================
// GEMINI INTERVIEW RESPONSE SCHEMA
// ============================================================

const geminiResponseSchema = {
    type: Type.OBJECT,

    properties: {
        title: {
            type: Type.STRING
        },

        matchScore: {
            type: Type.NUMBER
        },

        technicalQuestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,

                properties: {
                    question: {
                        type: Type.STRING
                    },

                    intention: {
                        type: Type.STRING
                    },

                    answer: {
                        type: Type.STRING
                    }
                },

                required: [
                    "question",
                    "intention",
                    "answer"
                ]
            }
        },

        behavioralQuestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,

                properties: {
                    question: {
                        type: Type.STRING
                    },

                    intention: {
                        type: Type.STRING
                    },

                    answer: {
                        type: Type.STRING
                    }
                },

                required: [
                    "question",
                    "intention",
                    "answer"
                ]
            }
        },

        skillGaps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,

                properties: {
                    skill: {
                        type: Type.STRING
                    },

                    severity: {
                        type: Type.STRING,
                        enum: [
                            "low",
                            "medium",
                            "high"
                        ]
                    }
                },

                required: [
                    "skill",
                    "severity"
                ]
            }
        },

        preparationPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,

                properties: {
                    day: {
                        type: Type.NUMBER
                    },

                    focus: {
                        type: Type.STRING
                    },

                    tasks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING
                        }
                    }
                },

                required: [
                    "day",
                    "focus",
                    "tasks"
                ]
            }
        }
    },

    required: [
        "title",
        "matchScore",
        "technicalQuestions",
        "behavioralQuestions",
        "skillGaps",
        "preparationPlan"
    ]
};

// ============================================================
// GENERATE INTERVIEW REPORT
// ============================================================

async function generateInterviewReport({
    resume,
    selfDescription,
    jobDescription
}) {

    const prompt = `
Generate an interview report based on the candidate information.

Candidate Resume:
${resume}

Candidate Self Description:
${selfDescription}

Job Description:
${jobDescription}

The report must contain:

1. TITLE

Generate a concise title representing the job role.

Examples:

Frontend Developer Interview
Backend Developer Interview
Full Stack Developer Interview
Software Engineer Interview


2. MATCH SCORE

Generate a score from 0 to 100.

The score represents how well the candidate's:

- skills
- experience
- education
- background

match the job description.


3. TECHNICAL QUESTIONS

Generate relevant technical interview questions based on:

- the candidate's resume
- the candidate's skills
- the job description

For every question provide:

question
intention
answer


4. BEHAVIORAL QUESTIONS

Generate relevant behavioral interview questions.

For every question provide:

question
intention
answer


5. SKILL GAPS

Identify important skills the candidate lacks or needs to improve
relative to the job description.

For every skill gap provide:

skill
severity

Severity must be exactly:

low
medium
high


6. PREPARATION PLAN

Generate a practical day-wise preparation plan.

For every day provide:

day
focus
tasks

Tasks must be an array of strings.

Base the preparation plan on the candidate's actual skill gaps
and the requirements of the job.

Do not invent candidate experience that is not present in the
provided information.
`;

    try {

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",

            contents: prompt,

            config: {
                responseMimeType: "application/json",
                responseSchema: geminiResponseSchema
            }
        });

        // ====================================================
        // RAW RESPONSE
        // ====================================================

        console.log(
            "================ GEMINI RESPONSE ================"
        );

        console.log(response.text);

        // ====================================================
        // CHECK RESPONSE
        // ====================================================

        if (!response.text) {
            throw new Error(
                "Gemini returned an empty response"
            );
        }

        // ====================================================
        // PARSE JSON
        // ====================================================

        let report;

        try {
            report = JSON.parse(response.text);
        } catch (error) {

            console.error(
                "Invalid JSON returned by Gemini:"
            );

            console.error(response.text);

            throw new Error(
                "Gemini returned invalid JSON"
            );
        }

        // ====================================================
        // ZOD VALIDATION
        // ====================================================

        const validatedReport =
            interviewReportSchema.parse(report);

        // ====================================================
        // DEBUG
        // ====================================================

        console.log(
            "================ VALIDATED REPORT ================"
        );

        console.log(
            JSON.stringify(
                validatedReport,
                null,
                2
            )
        );

        // ====================================================
        // RETURN
        // ====================================================

        return validatedReport;

    } catch (error) {

        console.error(
            "Error generating interview report:"
        );

        console.error(error);

        throw error;
    }
}

// ============================================================
// GENERATE PDF FROM HTML
// ============================================================

async function generatePdfFromHtml(htmlContent) {

    const browser = await puppeteer.launch({
        headless: true
    });

    try {

        const page = await browser.newPage();

        await page.setContent(
            htmlContent,
            {
                waitUntil: "networkidle0"
            }
        );

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px"
            }
        });

        return pdfBuffer;

    } finally {

        await browser.close();
    }
}

// ============================================================
// RESUME PDF SCHEMA
// ============================================================

const resumePdfSchema = z.object({
    html: z
        .string()
        .min(1)
        .describe(
            "Complete HTML content of the generated resume that can be converted to PDF using Puppeteer"
        )
});

// ============================================================
// GEMINI RESUME RESPONSE SCHEMA
// ============================================================

const resumeGeminiResponseSchema = {
    type: Type.OBJECT,

    properties: {
        html: {
            type: Type.STRING
        }
    },

    required: [
        "html"
    ]
};

// ============================================================
// GENERATE RESUME PDF
// ============================================================

async function generateResumePdf({
    resume,
    selfDescription,
    jobDescription
}) {

    const prompt = `
Generate a professional, ATS-friendly resume for the candidate.

Candidate Resume:
${resume}

Candidate Self Description:
${selfDescription}

Target Job Description:
${jobDescription}

Requirements:

- Tailor the resume to the target job.
- Highlight relevant skills.
- Highlight relevant projects and experience.
- Use professional resume formatting.
- Keep the information truthful.
- Do not invent experience, companies, projects, education,
  certifications or achievements.

PDF DESIGN REQUIREMENTS:

The HTML will be converted directly into an A4 PDF using Puppeteer.

Prioritize readability and visual clarity.

- Use a clean professional resume layout.
- Use Arial, Helvetica, or another professional sans-serif font.
- Body text should be approximately 10-11pt.
- Section headings should be approximately 14-18pt.
- Maintain consistent spacing between sections.
- Avoid excessive text.
- Avoid very small fonts.
- Avoid excessive columns.
- Avoid overlapping elements.
- Avoid fixed heights that can cause text overflow.
- Use clear section headings.
- Use bullet points for lists.
- Maintain good line spacing.
- Ensure the resume prints correctly on A4 pages.
- Use page-break-inside: avoid for important sections.
- Ensure sufficient contrast between text and background.

The HTML must include appropriate CSS for A4 printing.

Use:

<style>
@page {
    size: A4;
    margin: 15mm;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
    color: #222;
}

section {
    page-break-inside: avoid;
}

h1, h2, h3 {
    page-break-after: avoid;
}

ul {
    margin-top: 4px;
    padding-left: 18px;
}

li {
    margin-bottom: 3px;
}
</style>

Return a JSON object containing exactly one field:

"html"

The html field must contain complete HTML content.

Do not return markdown.
Do not wrap the HTML in code fences.
`;

    try {

        // ====================================================
        // GEMINI REQUEST
        // ====================================================

        const response = await ai.models.generateContent({

            model: "gemini-3-flash-preview",

            contents: prompt,

            config: {
                responseMimeType: "application/json",
                responseSchema:
                    resumeGeminiResponseSchema
            }
        });

        // ====================================================
        // CHECK RESPONSE
        // ====================================================

        if (!response.text) {
            throw new Error(
                "Gemini returned an empty resume response"
            );
        }

        console.log(
            "================ RESUME RESPONSE ================"
        );

        console.log(response.text);

        // ====================================================
        // PARSE JSON
        // ====================================================

        let parsedResponse;

        try {

            parsedResponse =
                JSON.parse(response.text);

        } catch (error) {

            console.error(
                "Invalid JSON returned by Gemini:"
            );

            console.error(response.text);

            throw new Error(
                "Gemini returned invalid JSON for resume"
            );
        }

        // ====================================================
        // ZOD VALIDATION
        // ====================================================

        const validatedResponse =
            resumePdfSchema.parse(
                parsedResponse
            );

        // ====================================================
        // GENERATE PDF
        // ====================================================

        const pdfBuffer =
            await generatePdfFromHtml(
                validatedResponse.html
            );

        return pdfBuffer;

    } catch (error) {

        console.error(
            "Error generating resume PDF:"
        );

        console.error(error);

        throw error;
    }
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
    generateInterviewReport,
    generateResumePdf
};