import { memo, useEffect, useRef } from 'react';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import EDITOR_JS_TOOLS from './Tool.tsx';

// Add readOnly to the interface
interface EditorProps {
  data: OutputData | undefined;
  onChange?: (data: OutputData) => void; // Made optional for readOnly mode
  editorBlock: string;
  readOnly?: boolean; // New prop
}

const Editor = ({ data, onChange, editorBlock, readOnly = false }: EditorProps) => {
  const ref = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (!ref.current) {
      const editor = new EditorJS({
        holder: editorBlock,
        data: data,
        tools: EDITOR_JS_TOOLS,
        readOnly: readOnly, // Pass the readOnly flag here
        
        async onChange(api) {
          if (!readOnly && onChange) {
            const savedData = await api.saver.save();
            onChange(savedData);
          }
        },
      });
      ref.current = editor;
    }

    return () => {
      if (ref.current && ref.current.destroy) {
        ref.current.destroy();
        ref.current = null;
      }
    };
  }, [data, editorBlock, onChange, readOnly]); 

  // Make the container look like normal text if readOnly, otherwise add styling for editing
  return <div id={editorBlock} className={readOnly ? "prose max-w-none" : ""} />;
};

export default memo(Editor);