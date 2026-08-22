import {
    generateInterviewReport as generateInterviewReportApi,
    getAllInterviewReports,
    getInterviewReportById,
    generateResumePdf
} from "../services/interview.api";

import { useContext, useEffect } from "react";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router-dom";

export const useInterview = () => {

    const context = useContext(InterviewContext);

    const { interviewId } = useParams();

    if (!context) {
        throw new Error(
            "useInterview must be within an InterviewProvider"
        );
    }

    const {

        loading,
        setLoading,
        report,
        setReport,
        reports,
        setReports,
        pdfLoading,
        setPdfLoading

    } = context;


    // ============================================================
    // DOWNLOAD RESUME PDF
    // ============================================================

    const getResumePdf = async (interviewReportId) => {

        setPdfLoading(true);

        try {

            const response = await generateResumePdf({
                interviewReportId
            });

            const blob = new Blob(
                [response],
                {
                    type: "application/pdf"
                }
            );

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            link.download =
                `resume_${interviewReportId}.pdf`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (error) {

            console.error(
                "PDF generation failed:",
                error
            );

        } finally {

            setPdfLoading(false);

        }
    };


    // ============================================================
    // GENERATE INTERVIEW REPORT
    // ============================================================

    const generateReport = async ({
        jobDescription,
        selfDescription,
        resumeFile
    }) => {

        setLoading(true);

        try {

            const response =
                await generateInterviewReportApi({
                    jobDescription,
                    selfDescription,
                    resumeFile
                });

            setReport(
                response.interviewReport
            );

            await getReports();

            return response.interviewReport;

        } catch (error) {

            console.error(
                "Generate report error:",
                error
            );

            throw error;

        } finally {

            setLoading(false);

        }
    };


    // ============================================================
    // GET REPORT BY ID
    // ============================================================

    const getReportById = async (interviewId) => {

        setLoading(true);

        try {

            const response =
                await getInterviewReportById(
                    interviewId
                );

            setReport(
                response.interviewReport
            );

            return response.interviewReport;

        } catch (error) {

            console.error(
                "Get report error:",
                error
            );

            throw error;

        } finally {

            setLoading(false);

        }
    };


    // ============================================================
    // GET ALL REPORTS
    // ============================================================

    const getReports = async () => {

        setLoading(true);

        try {

            const response =
                await getAllInterviewReports();

            setReports(
                response.interviewReports
            );

            return response.interviewReports;

        } catch (error) {

            console.error(
                "Get reports error:",
                error
            );

            throw error;

        } finally {

            setLoading(false);

        }
    };


    // ============================================================
    // LOAD DATA
    // ============================================================

    useEffect(() => {

        if (interviewId) {

            getReportById(interviewId);

        } else {

            getReports();

        }

    }, [interviewId]);


    return {
        loading,
        report,
        reports,
        generateReport,
        getReports,
        getReportById,
        getResumePdf,
        pdfLoading
    };
};