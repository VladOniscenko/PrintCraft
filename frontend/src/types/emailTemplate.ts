export interface EmailTemplate {
  id: string;
  templateName: string;
  subject: string;
  body: string;
  isSystemTemplate?: boolean;
  detectedPlaceholders?: string[];
}

export interface PreviewEmailTemplateResponse {
  templateName: string;
  subject: string;
  htmlBody: string;
  variables: Record<string, string>;
}

