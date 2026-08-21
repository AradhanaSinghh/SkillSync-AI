const { GoogleGenAI, Type } = require("@google/genai");
const { z } = require("zod");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});


// ============================================================
// ZOD VALIDATION SCHEMA
// ============================================================

const interviewReportSchema = z.object({

    title: z
        .string()
        .describe(
            "The title of the job for which the interview report is generated"
        ),

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
            day: z.number(),
            focus: z.string(),
            tasks: z.array(z.string())
        })
    )

});


// ============================================================
// GEMINI RESPONSE SCHEMA
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

The report must evaluate how well the candidate matches the job
and prepare the candidate for the interview.

Candidate Resume:

${resume}


Candidate Self Description:

${selfDescription}


Job Description:

${jobDescription}


Generate the following:


0. TITLE

Generate a concise title for the interview report.

The title should represent the job role from the job description.

Examples:

"Frontend Developer Interview"

"Backend Developer Interview"

"Full Stack Developer Interview"

"Software Engineer Interview"


1. MATCH SCORE

Generate a match score from 0 to 100.

The score should represent how well the candidate's
skills, experience and background match the job description.


2. TECHNICAL INTERVIEW QUESTIONS

Generate relevant technical interview questions based
on the candidate's resume and the job description.

For every question provide:

- question
- intention
- answer


3. BEHAVIORAL INTERVIEW QUESTIONS

Generate relevant behavioral interview questions.

For every question provide:

- question
- intention
- answer


4. SKILL GAPS

Identify the candidate's important skill gaps
relative to the job description.

For every skill gap provide:

- skill
- severity

Severity must be exactly one of:

low
medium
high


5. PREPARATION PLAN

Generate a day-wise interview preparation plan.

For every day provide:

- day
- focus
- tasks

Tasks must be an array of strings.


IMPORTANT:

Return ONLY valid JSON.

The JSON must strictly follow the provided response schema.

Do not add markdown.

Do not add explanations outside the JSON.

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

                responseSchema: geminiResponseSchema

            }

        });


        // ====================================================
        // RAW GEMINI RESPONSE
        // ====================================================

        console.log(
            "================ GEMINI RESPONSE ================"
        );

        console.log(response.text);


        // ====================================================
        // PARSE JSON
        // ====================================================

        const report = JSON.parse(response.text);


        // ====================================================
        // DEBUG
        // ====================================================

        console.log(
            "================ RESPONSE TYPES ================"
        );

        console.log(
            "title:",
            typeof report.title
        );

        console.log(
            "matchScore:",
            typeof report.matchScore
        );

        console.log(
            "technicalQuestions is array:",
            Array.isArray(report.technicalQuestions)
        );

        console.log(
            "behavioralQuestions is array:",
            Array.isArray(report.behavioralQuestions)
        );

        console.log(
            "skillGaps is array:",
            Array.isArray(report.skillGaps)
        );

        console.log(
            "preparationPlan is array:",
            Array.isArray(report.preparationPlan)
        );


        // ====================================================
        // ZOD VALIDATION
        // ====================================================

        const validatedReport =
            interviewReportSchema.parse(report);


        // ====================================================
        // VALIDATED REPORT
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


module.exports = generateInterviewReport;