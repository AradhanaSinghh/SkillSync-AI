const { GoogleGenAI, Type } = require("@google/genai");
const { z } = require("zod");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});


// ===============================
// ZOD SCHEMA
// ===============================

const interviewReportSchema = z.object({

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


// ===============================
// GEMINI RESPONSE SCHEMA
// ===============================

const geminiResponseSchema = {

    type: Type.OBJECT,

    properties: {

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
        "matchScore",
        "technicalQuestions",
        "behavioralQuestions",
        "skillGaps",
        "preparationPlan"
    ]
};


// ===============================
// GENERATE INTERVIEW REPORT
// ===============================

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

Generate:

1. A match score from 0 to 100.

2. Technical interview questions.
For every question provide:
- question
- intention
- answer

3. Behavioral interview questions.
For every question provide:
- question
- intention
- answer

4. Skill gaps.
For every skill gap provide:
- skill
- severity

Severity must be exactly one of:
low
medium
high

5. A day-wise preparation plan.
For every day provide:
- day
- focus
- tasks

Tasks must be an array of strings.

Return the response according to the provided response schema.
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


        // ===============================
        // RAW RESPONSE
        // ===============================

        console.log(
            "================ GEMINI RESPONSE ================"
        );

        console.log(response.text);


        // ===============================
        // PARSE JSON
        // ===============================

        const report = JSON.parse(response.text);


        // ===============================
        // CHECK ARRAYS
        // ===============================

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


        // ===============================
        // ZOD VALIDATION
        // ===============================

        const validatedReport =
            interviewReportSchema.parse(report);


        console.log(
            "================ VALIDATED REPORT ================"
        );

        console.log(
            JSON.stringify(validatedReport, null, 2)
        );


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