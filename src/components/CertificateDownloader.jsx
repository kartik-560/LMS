// CertificateDownloader.jsx
import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Certificate from "./Certificate"; 

const CertificateDownloader = ({ studentName, courseName }) => {
  const certificateRef = useRef();
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadPdf = () => {
    const input = certificateRef.current;
    if (!input) return;

    setIsLoading(true);

   
    html2canvas(input, {
      scale: 3, 
      useCORS: true, 
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");

   
      const pdf = new jsPDF('l', 'px', [1056, 816]); 
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      
      const safeStudentName = studentName.replace(/ /g, "_");
      const safeCourseName = courseName.replace(/ /g, "_");

      pdf.save(`Certificate-${safeStudentName}-${safeCourseName}.pdf`);
      setIsLoading(false);
    });
  };

  return (
    <div>

      <button
        onClick={handleDownloadPdf}
        disabled={isLoading}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          backgroundColor: "#5A318A",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {isLoading ? "Generating PDF..." : "Download Certificate"}
      </button>

      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <Certificate
          ref={certificateRef}
          studentName={studentName}
          courseName={courseName}
        />
      </div>
    </div>
  );
};

export default CertificateDownloader;