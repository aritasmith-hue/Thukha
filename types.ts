
export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

export interface ParsedReport {
  patientId: string;
  sections: { title: string; content: string }[];
}

export interface Medication {
  name: string;
  strength: string;
  frequency: string;
  duration: string;
  purpose: string;
}
