import React, { createContext, useState } from "react";

export const InterviewContext = createContext(null);

export const InterviewProvider = ({ children }) => {

    const [loading, setLoading] = useState(false);

    const [report, setReport] = useState(null);

    const [reports, setReports] = useState([]);
    
    const [pdfLoading,setPdfLoading]=useState(false);

    return (
        <InterviewContext.Provider
            value={{
                loading,
                setLoading,

                report,
                setReport,

                reports,
                setReports,
                
                pdfLoading,
                setPdfLoading
            }}
        >
            {children}
        </InterviewContext.Provider>
    );
};