const pdfParse=require("pdf-parse");
const {generateInterviewReport,generateResumePdf}=require("../services/ai.service.js");
const interviewReportModel=require("../models/interviewReport.model.js");

async function generateInterviewReportController(req,res){
    const resumeFile=req.file
    const resumeContent = await (
    new pdfParse.PDFParse(
        Uint8Array.from(req.file.buffer)
    )
).getText();
    const {selfDescription,jobDescription}=req.body;

    const interviewReportByAi=await generateInterviewReport({
        resume:resumeContent.text,
        selfDescription,
        jobDescription
    });

    const interviewReport=await interviewReportModel.create({
        user:req.user.id,
        resume:resumeContent.text,
        selfDescription,
        jobDescription,
        ...interviewReportByAi
    })

    res.status(201).json({
        message:"Interview report generated successfully..",
        interviewReport
    })
}
async function getInterviewReportByIdController(req,res){
    const {interviewId}=req.params;

    const interviewReport=await interviewReportModel.findOne({
        _id:interviewId,
        user:req.user.id
    })

    if(!interviewReport){
        return res.status(404).json({
            message:"Interview report not found."
        })
    }

    res.status(200).json({
        message:"Interview report fetched successfully.",
        interviewReport
    })
}

async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select(
                "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan"
            );

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch interview reports",
            error: error.message
        });
    }
}
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found"
            });
        }

        const {
            resume,
            jobDescription,
            selfDescription
        } = interviewReport;

        const pdfBuffer = await generateResumePdf({
            resume,
            jobDescription,
            selfDescription
        });

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition":
                `attachment; filename=resume_${interviewReportId}.pdf`,
            "Content-Length": pdfBuffer.length
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error("PDF generation error:", error);

        res.status(500).json({
            message: "Failed to generate resume PDF",
            error: error.message
        });
    }
}
module.exports={generateInterviewReportController,getInterviewReportByIdController,getAllInterviewReportsController,generateResumePdfController}