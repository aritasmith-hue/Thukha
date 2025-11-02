import React, { useState, useCallback } from 'react';
import { UploadedFile, Medication } from './types';
import { generateReport } from './services/geminiService';
import { saveReport, getHistory } from './services/historyService';
import { FileUpload } from './components/FileUpload';
import { ReportDisplay } from './components/ReportDisplay';
import { LoadHistoryModal } from './components/LoadHistoryModal';
import { PatientHistoryDisplay } from './components/PatientHistoryDisplay';
import { LogoIcon, NewIcon, HistoryIcon } from './components/icons';

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [patientHistory, setPatientHistory] = useState<string>('');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  const handleFilesChange = useCallback((newFiles: UploadedFile[]) => {
    setFiles(newFiles);
    setReport('');
    setError('');
  }, []);

  const handleGenerateReport = useCallback(async () => {
    if (files.length === 0) {
      setError('Please upload at least one document or image.');
      return;
    }
    setIsLoading(true);
    setError('');
    setReport('');

    try {
      const generatedReport = await generateReport(files, patientHistory);
      setReport(generatedReport);
      
      // Auto-save the report to history
      const patientIdMatch = generatedReport.match(/Patient ID:\s*([^\s\n]+)/);
      if (patientIdMatch && patientIdMatch[1]) {
        saveReport(patientIdMatch[1], generatedReport);
      }

    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? `Failed to generate report: ${e.message}` : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [files, patientHistory]);
  
  const handleNewPatient = useCallback(() => {
    // Revoke object URLs to prevent memory leaks
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setReport('');
    setError('');
    setPatientHistory('');
  }, [files]);

  const handleReportChange = useCallback((newReport: string) => {
    setReport(newReport);
  }, []);
  
  const handleLoadHistory = useCallback(async (patientId: string) => {
    if (!patientId) return;
    setIsLoading(true);
    try {
      const history = await getHistory(patientId);
      if (history) {
        setPatientHistory(history);
      } else {
        alert(`No history found for Patient ID: ${patientId}`);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load patient history.");
    } finally {
      setIsHistoryModalOpen(false);
      setIsLoading(false);
    }
  }, []);

  const handleAddMedication = useCallback((med: Medication) => {
    const newMedRow = `| ${med.name} | ${med.strength} | ${med.frequency} | ${med.duration} | ${med.purpose} |`;
    const tableHeaderAndSeparator = `| Drug Name | Strength/Dose | Frequency | Duration | Purpose/Notes |\n|---|---|---|---|---|`;
    const fullTable = `## 💊 Suggested Treatment Prescription\n${tableHeaderAndSeparator}`;
    const prescriptionSectionRegex = /## 💊 Suggested Treatment Prescription/i;

    setReport(currentReport => {
      if (currentReport.trim() === '') {
          return `${fullTable}\n${newMedRow}`;
      }
      
      if (prescriptionSectionRegex.test(currentReport)) {
        const lines = currentReport.split('\n');
        const separatorIndex = lines.findIndex(line => line.trim().match(/^\|---\|/));
        
        if (separatorIndex !== -1) {
            // Table exists, find last row and insert after it
            let lastRowIndex = separatorIndex;
            for(let i = separatorIndex + 1; i < lines.length; i++) {
                if(lines[i].trim().startsWith('|')) {
                    lastRowIndex = i;
                } else {
                    break;
                }
            }
            lines.splice(lastRowIndex + 1, 0, newMedRow);
            return lines.join('\n');
        } else {
            // Header exists, but no table. Find header and insert table after it.
            const headerIndex = lines.findIndex(line => prescriptionSectionRegex.test(line));
            if (headerIndex !== -1) {
                lines.splice(headerIndex + 1, 0, `${tableHeaderAndSeparator}\n${newMedRow}`);
                return lines.join('\n');
            }
             // Fallback if regex test passes but findIndex fails (shouldn't happen)
             return `${currentReport.trim()}\n\n${fullTable}\n${newMedRow}`;
        }
      } else {
        // Section doesn't exist, create it.
        const adviceSection = '## 🗣 Patient Advice (in Myanmar)';
        const reportParts = currentReport.split(adviceSection);
        if (reportParts.length > 1) {
            // Insert before advice section for better structure
            return `${reportParts[0].trim()}\n\n${fullTable}\n${newMedRow}\n\n${adviceSection}${reportParts[1]}`;
        } else {
            // Append to end
            return `${currentReport.trim()}\n\n${fullTable}\n${newMedRow}`;
        }
      }
    });
  }, []);


  return (
    <>
    <div className="min-h-screen bg-teal-50/50 font-sans text-gray-800">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <LogoIcon className="h-10 w-10 text-teal-600" />
            <div>
              <h1 className="text-xl font-bold text-teal-800">Thukha Medical Center</h1>
              <p className="text-sm text-gray-500">AI Diagnostic Assistant</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-8">
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80 flex flex-col">
            <div>
              <h2 className="text-2xl font-semibold text-gray-700 border-b pb-3 mb-4">Upload Patient Documents</h2>
              <p className="text-gray-600 mb-6">Upload patient documents, ECGs, X-rays, ultrasounds, or lab reports to begin analysis.</p>
              <FileUpload files={files} onFilesChange={handleFilesChange} />
            </div>
            
            {patientHistory && (
              <PatientHistoryDisplay 
                history={patientHistory} 
                onClear={() => setPatientHistory('')}
              />
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGenerateReport}
                disabled={isLoading || files.length === 0}
                className="w-full flex-1 bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/50 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <span>Generate Report</span>
                )}
                {isLoading && <span>Processing...</span>}
              </button>
               <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-blue-50 border border-blue-300 text-blue-700 font-bold py-3 px-4 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  title="Load past reports for a patient"
                >
                  <HistoryIcon className="h-5 w-5" />
                  <span>Load History</span>
                </button>
               <button
                onClick={handleNewPatient}
                disabled={isLoading && files.length === 0}
                className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-500/50 transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                title="Clear all files and start a new report"
              >
                <NewIcon className="h-5 w-5" />
                <span>New Patient</span>
              </button>
            </div>
             {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
          </div>
          
          <div className="mt-8 lg:mt-0">
            <ReportDisplay
              reportMarkdown={report}
              isLoading={isLoading}
              onReportChange={handleReportChange}
              onAddMedication={handleAddMedication}
            />
          </div>

        </div>
      </main>
      <footer className="text-center py-6 text-sm text-gray-500 mt-8">
          <p>© Thukha Medical Center (Advanced Natural Health Care Center) – Yangon, Myanmar</p>
      </footer>
    </div>
    <LoadHistoryModal 
      isOpen={isHistoryModalOpen}
      onClose={() => setIsHistoryModalOpen(false)}
      onLoad={handleLoadHistory}
    />
    </>
  );
};

export default App;