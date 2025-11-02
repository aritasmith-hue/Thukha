interface ReportRecord {
  date: string;
  report: string;
}

const HISTORY_PREFIX = 'tmc_patient_history_';

/**
 * Saves a new report for a given patient ID to local storage.
 * @param patientId The ID of the patient.
 * @param reportMarkdown The full markdown content of the report.
 */
export const saveReport = (patientId: string, reportMarkdown: string): void => {
  if (!patientId) return;

  const key = `${HISTORY_PREFIX}${patientId}`;
  try {
    const existingHistoryRaw = localStorage.getItem(key);
    const history: ReportRecord[] = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];

    const newRecord: ReportRecord = {
      date: new Date().toISOString(),
      report: reportMarkdown,
    };

    // Add the new report and keep only the last 5 reports to manage space
    const updatedHistory = [newRecord, ...history].slice(0, 5);

    localStorage.setItem(key, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Failed to save report to local storage:", error);
  }
};

/**
 * Retrieves and summarizes the report history for a given patient ID.
 * @param patientId The ID of the patient.
 * @returns A promise that resolves to a summary string or null if no history is found.
 */
export const getHistory = (patientId: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!patientId) {
      resolve(null);
      return;
    }

    const key = `${HISTORY_PREFIX}${patientId}`;
    try {
      const historyRaw = localStorage.getItem(key);
      if (!historyRaw) {
        resolve(null);
        return;
      }

      const history: ReportRecord[] = JSON.parse(historyRaw);

      if (history.length === 0) {
        resolve(null);
        return;
      }
      
      const summary = history
        .map(record => {
            const visitDateMatch = record.report.match(/Date:\s*(.*)/);
            const impressionsMatch = record.report.match(/## 🧾 Impressions \/ Findings\s*([\s\S]*?)(?=\n##|$)/);
            
            const visitDate = visitDateMatch ? visitDateMatch[1].trim() : new Date(record.date).toLocaleDateString();
            const impressions = impressionsMatch ? impressionsMatch[1].trim() : '[No impression found]';

            return `PAST VISIT on ${visitDate}:\n- Impressions: ${impressions.replace(/\n-/g, ',')}`;
        })
        .join('\n\n');

      resolve(summary);

    } catch (error) {
      console.error("Failed to retrieve or parse history from local storage:", error);
      resolve(null);
    }
  });
};