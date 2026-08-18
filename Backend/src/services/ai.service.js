const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

const interviewReportSchema = z.object({
    matchScore: z.number().describe(
        "A score between 0 and 100 indicating how well the candidate profile matches the job description"
    ),

    technicalQuestions: z.array(
        z.object({
            question: z.string().describe(
                "The technical question that can be asked in the interview"
            ),

            intention: z.string().describe(
                "The intention of the interviewer behind asking this question"
            ),

            answer: z.string().describe(
                "How to answer this question, what points to cover, and what approach to take"
            )
        })
    ).describe(
        "Technical questions that can be asked in the interview along with answer guidance"
    ),

    behavioralQuestions: z.array(
        z.object({
            question: z.string().describe(
                "The behavioral question that can be asked in the interview"
            ),

            intention: z.string().describe(
                "The intention of the interviewer behind asking this question"
            ),

            answer: z.string().describe(
                "How to answer this question, what points to cover, and what approach to take"
            )
        })
    ).describe(
        "Behavioral questions that can be asked in the interview along with answer guidance"
    ),

    skillGaps: z.array(
        z.object({
            skill: z.string().describe(
                "The skill which the candidate is lacking or needs to improve"
            ),

            severity: z.enum(["low", "medium", "high"]).describe(
                "The severity of the skill gap"
            )
        })
    ).describe(
        "List of skill gaps in the candidate's profile along with severity"
    ),

    preparationPlan: z.array(
        z.object({
            day: z.number().describe(
                "The day number in the preparation plan, starting from 1"
            ),

            focus: z.string().describe(
                "The main focus of this day's preparation"
            ),

            tasks: z.array(z.string()).describe(
                "List of tasks to be completed on this day"
            )
        })
    ).describe(
        "A day-wise preparation plan to address the candidate's skill gaps"
    )
});


async function generateInterviewReport({
    resume,
    selfDescription,
    jobDescription
}) {

    const prompt = `
You are an expert technical interviewer and career coach.

Analyze the candidate's resume, self-description, and job description.

Generate a structured interview preparation report containing:

1. matchScore:
   Give a score between 0 and 100 indicating how well the candidate
   matches the job description.

2. technicalQuestions:
   Generate relevant technical interview questions based on:
   - Candidate's skills
   - Candidate's projects
   - Candidate's experience
   - Technologies mentioned in the job description

   For every question provide:
   - The question
   - The interviewer's intention
   - Guidance on how the candidate should answer

3. behavioralQuestions:
   Generate relevant behavioral interview questions based on the
   candidate's background and the job requirements.

   For every question provide:
   - The question
   - The interviewer's intention
   - Guidance on how the candidate should answer

4. skillGaps:
   Identify skills required by the job description that are missing
   or weak in the candidate's profile.

   Assign each skill gap one severity:
   - low
   - medium
   - high

5. preparationPlan:
   Create a day-wise preparation plan that helps the candidate
   address the identified skill gaps.

IMPORTANT:
- Return only the structured JSON matching the provided schema.
- Do not return a general prose interview report.
- Do not add fields that are not present in the schema.
- Base the analysis only on the provided candidate information
  and job description.

Candidate Resume:
${resume}

Candidate Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

    try {

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",

            contents: prompt,

            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(
                    interviewReportSchema
                )
            }
        });

        return JSON.parse(repsonse.text);

    } catch (error) {

        console.error(
            "Error generating interview report:",
            error
        );

        throw error;
    }
}


module.exports = generateInterviewReport;