import { memo, useEffect, useRef } from 'react';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import EDITOR_JS_TOOLS from './Tool.tsx';

interface EditorProps {
  data: OutputData | undefined;
  onChange?: (data: OutputData) => void;
  editorBlock: string;
  readOnly?: boolean;
}

const Editor = ({ data, onChange, editorBlock, readOnly = false }: EditorProps) => {
  const ref = useRef<EditorJS | null>(null);
  
  // 1. Keep a mutable ref of the latest onChange function
  // This prevents the "stale closure" problem without triggering re-renders
  const onChangeRef = useRef(onChange);

  // 2. Update the ref whenever the parent passes a new onChange function
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!ref.current) {
      const editor = new EditorJS({
        holder: editorBlock,
        data: data, // This is only read ONCE when the component mounts
        tools: EDITOR_JS_TOOLS,
        readOnly: readOnly,
        
        async onChange(api) {
          if (!readOnly && onChangeRef.current) {
            const savedData = await api.saver.save();
            onChangeRef.current(savedData); // Use the ref here
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
    // 3. IMPORTANT: Empty dependency array so this ONLY runs on mount and unmount.
    // It will no longer destroy the editor when you type.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  return <div id={editorBlock} className="prose max-w-none" />;
};

export default memo(Editor);