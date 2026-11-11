/** Master admin posting on behalf of a school (same UI as external admin). */
export type ExternalAdminComposeMasterOptions = {
  schoolId: string;
  schoolName: string;
  onSaved: () => void;
  uploadImage: (file: File) => Promise<string>;
  submitRequest: (payload: Record<string, unknown>) => Promise<unknown>;
  invalidateQueryKeys?: string[][];
};
