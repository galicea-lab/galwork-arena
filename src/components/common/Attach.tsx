import React from "react";
import { Icon } from '@iconify/react';
import {uploadFile} from '@/api/jform'

type AParams = {
  token : string;
  id : number;
}

export default function Attach(props : AParams) {
  const [selectedFile, setSelectedFile] = React.useState<File>();
  const [description, setDescription] = React.useState("");
  const [uploadResponse, setUploadResponse] = React.useState("");
  let { token, id, } = props

  const submitForm = (event: { preventDefault: () => void; }) => {
    event.preventDefault();

    if (selectedFile) {
        uploadFile(token, id,selectedFile, description)
        .then((response : any) => {
          setUploadResponse('Zapisano załącznik')
        })
        .catch((error: any) => {
          setUploadResponse(`Błąd wysyłania załącznika: ${error}`);
        });
      }
  };

  return (
    <form onSubmit={submitForm} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Opis / nazwa</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="opis / nazwa"
          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Plik</label>
        <input
          type="file"
          onChange={(e: React.FormEvent<HTMLInputElement>) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files[0]) setSelectedFile(files[0])
          }}
          className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
      >
        <Icon icon="mdi:upload" className="w-4 h-4" />
        Wyślij
      </button>

      {uploadResponse && (
        <p className="w-full text-xs text-slate-600 mt-1">{uploadResponse}</p>
      )}
    </form>
  );
}
