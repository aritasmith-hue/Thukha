import React, { useState, useMemo } from 'react';
import { exportReportAsDocx } from '../services/docxService';
import { DownloadIcon, EditIcon, SaveIcon, CancelIcon, PillIcon, PrintIcon } from './icons';
import { PRESET_MEDICATIONS } from '../constants';
import { Medication } from '../types';


interface ReportDisplayProps {
  reportMarkdown: string;
  isLoading: boolean;
  onReportChange: (newMarkdown: string) => void;
  onAddMedication: (med: Medication) => void;
}

const parsePatientId = (markdown: string): string => {
  const match = markdown.match(/Patient ID:\s*([^\s\n]+)/);
  return match ? match[1] : `TMC_Report_${new Date().toISOString().split('T')[0]}`;
};

const MedicationPresets: React.FC<{ onAdd: (med: Medication) => void; disabled: boolean }> = ({ onAdd, disabled }) => (
    <div className="mb-4 p-4 bg-teal-50/70 rounded-lg border border-teal-200/50">
        <h3 className="text-sm font-semibold text-teal-800 flex items-center space-x-2 mb-3">
            <PillIcon className="h-5 w-5" />
            <span>Add Medication Presets</span>
        </h3>
        <div className="flex flex-wrap gap-2">
            {PRESET_MEDICATIONS.map(med => (
                <button
                    key={med.name}
                    onClick={() => onAdd(med)}
                    disabled={disabled}
                    className="px-3 py-1 text-xs font-medium text-teal-700 bg-white border border-teal-300 rounded-full hover:bg-teal-100 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    {med.name}
                </button>
            ))}
        </div>
    </div>
);


export const ReportDisplay: React.FC<ReportDisplayProps> = ({ reportMarkdown, isLoading, onReportChange, onAddMedication }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState(reportMarkdown);

  React.useEffect(() => {
    setEditedMarkdown(reportMarkdown);
    if(isEditing && reportMarkdown === '') {
        setIsEditing(false); // Exit edit mode if a new patient is cleared
    }
  }, [reportMarkdown]);

  const handleSave = () => {
    onReportChange(editedMarkdown);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedMarkdown(reportMarkdown); // Revert changes
    setIsEditing(false);
  };

  const handleExport = () => {
    if (reportMarkdown) {
      const patientId = parsePatientId(reportMarkdown);
      exportReportAsDocx(reportMarkdown, patientId);
    }
  };

  const handlePrint = () => {
    if (!window.confirm('This will prepare the report for printing. Continue?')) {
      return;
    }

    const reportContentElement = document.querySelector('.report-content');
    if (!reportContentElement) {
      alert('Error: Could not find report content.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Could not open print window. Please disable any pop-up blockers and try again.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Thukha Medical Center - GP Consultation & Diagnostic Report</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body { padding: 1rem; }
          </style>
        </head>
        <body>
          <div class="prose prose-sm max-w-none">
            ${reportContentElement.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
  };
  
  const renderMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    let isTable = false;
    let tableHeaders: string[] = [];

    return lines.map((line, index) => {
        if (line.startsWith('## ')) {
            isTable = false;
            return <h2 key={index} className="text-xl font-bold text-teal-800 mt-6 mb-3 pb-2 border-b border-teal-100">{line.substring(3)}</h2>;
        }
        if (line.startsWith('**') && line.includes(':**')) {
             isTable = false;
            const parts = line.split(':**');
            const key = parts[0].replace(/\*\*/g, '').trim();
            const value = parts[1].trim();
            return <p key={index} className="text-gray-700 mb-1"><strong className="font-semibold text-gray-900">{key}:</strong> {value}</p>;
        }
        if (line.startsWith('- ')) {
             isTable = false;
            return <li key={index} className="text-gray-700 ml-5 list-disc">{line.substring(2)}</li>;
        }
        if (line.startsWith('|')) {
            const cells = line.split('|').map(c => c.trim()).slice(1, -1);
            if (line.includes('---')) {
                isTable = true;
                return null;
            }
            if (!isTable) {
                isTable = true;
                tableHeaders = cells;
                return (
                    <table key={index} className="w-full mt-4 border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                {tableHeaders.map((header, i) => <th key={i} className="border border-gray-300 p-2 text-left font-semibold text-gray-700">{header}</th>)}
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                );
            }
             if (isTable && tableHeaders.length > 0) {
                 return (
                     <tr key={index}>
                         {cells.map((cell, i) => <td key={i} className="border border-gray-300 p-2">{cell}</td>)}
                     </tr>
                 )
             }
        }
        
        if (line.trim() === '') return <div key={index} className="h-2"></div>;

        isTable = false;
        return <p key={index} className="text-gray-700 mb-2">{line}</p>;
    }).reduce((acc: React.ReactElement[], el) => {
        if (el && el.type === 'tr') {
            const lastChild = acc[acc.length - 1];
            if (lastChild && lastChild.type === 'table') {
                const tableChildren = React.Children.toArray((lastChild.props as React.PropsWithChildren<unknown>).children);
                const thead = tableChildren[0];
                const tbody = tableChildren[1];

                if (React.isValidElement<React.PropsWithChildren<{}>>(tbody)) {
                    const newTbody = React.cloneElement(tbody, {}, [...React.Children.toArray(tbody.props.children), el]);
                    const newTable = React.cloneElement(lastChild, {}, [thead, newTbody]);
                    acc[acc.length - 1] = newTable;
                }
            }
        } else if (el) {
            acc.push(el);
        }
        return acc;
    }, []);
  };


  const Content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <svg className="animate-spin h-12 w-12 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg font-semibold text-gray-700">Analyzing Documents...</p>
          <p className="text-gray-500">The AI assistant is generating the report. This may take a moment.</p>
        </div>
      );
    }
     if (isEditing) {
        return (
             <div className="flex flex-col h-full">
                <textarea
                    value={editedMarkdown}
                    onChange={(e) => setEditedMarkdown(e.target.value)}
                    className="w-full flex-1 p-3 font-mono text-sm bg-gray-800 text-white caret-white border border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[60vh]"
                    aria-label="Edit report content"
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={handleCancel} className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2">
                       <CancelIcon className="h-4 w-4" /> Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
                       <SaveIcon className="h-4 w-4" /> Save Changes
                    </button>
                </div>
            </div>
        );
    }
    if (reportMarkdown) {
      return (
          <div className="report-content">{renderMarkdown(reportMarkdown)}</div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center text-center h-full min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-700">GP Consultation & Diagnostic Report</h3>
            <p className="mt-2 text-gray-500">The generated report will appear here once you upload documents and start the analysis.</p>
        </div>
      </div>
    );
  }, [isLoading, reportMarkdown, isEditing, editedMarkdown]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80 relative">
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">Generated Report</h2>
        <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              disabled={!reportMarkdown || isLoading || isEditing}
              className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-3 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-500/50 transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              title="Edit the report"
            >
              <EditIcon className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!reportMarkdown || isLoading || isEditing}
              className="bg-sky-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-500/50 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
              title="Print the report"
            >
              <PrintIcon className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExport}
              disabled={!reportMarkdown || isLoading}
              className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
              title="Save and export as a Word document"
            >
              <DownloadIcon className="h-4 w-4" />
              <span>Save and Export</span>
            </button>
        </div>
      </div>
      
      {!isLoading && !isEditing && (
        <MedicationPresets onAdd={onAddMedication} disabled={isLoading || isEditing} />
      )}

      <div className="prose prose-sm max-w-none report-content-wrapper overflow-y-auto max-h-[70vh]">
        {Content}
      </div>
    </div>
  );
};