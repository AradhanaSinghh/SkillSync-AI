import {generateInterviewReport,getAllInterviewReports,getInterviewReportById} from "../services/interview.api"
import {useContext} from "react"
import { InterviewContext } from "../interview.context"
export const useInterview=()=>{
    const context=useContext(InterviewContext);

    if(!context){
        throw new Error("useInterview must be within an interviewProvider");
    }
    const {loading,setLoading,report,setReport,reports,setReports}=context;

    const generateInterviewReport=async ({})
}