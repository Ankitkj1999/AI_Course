/**
 * Speech to Text Plugin for AI Course Editor
 * Based on Lexical playground implementation with real-time feedback
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical';
import { useEffect, useRef, useState } from 'react';

import { 
  SPEECH_TO_TEXT_COMMAND, 
  VOICE_COMMANDS, 
  SUPPORT_SPEECH_RECOGNITION 
} from './SpeechToTextConstants';
import useReport from '../hooks/useReport';

// TypeScript declarations for SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
  addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
  addEventListener(type: 'end', listener: () => void): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  item(index: number): SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

// Constructor interface
interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

function SpeechToTextPlugin(): null {
  const [editor] = useLexicalComposerContext();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  
  // Get the appropriate SpeechRecognition constructor
  const SpeechRecognitionClass: SpeechRecognitionConstructor = 
    (window.SpeechRecognition || window.webkitSpeechRecognition) as SpeechRecognitionConstructor;
  
  const recognition = useRef<ISpeechRecognition | null>(null);
  const report = useReport();

  useEffect(() => {
    if (isEnabled && recognition.current === null) {
      recognition.current = new SpeechRecognitionClass();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US'; // Set language
      
      // Handle speech recognition results
      recognition.current.addEventListener('result', (event: SpeechRecognitionEvent) => {
        const resultItem = event.results.item(event.resultIndex);
        const { transcript } = resultItem.item(0);

        // Show real-time feedback for both interim and final results
        report(transcript, !resultItem.isFinal);

        // Only process final results to avoid inserting interim text
        if (!resultItem.isFinal) {
          return;
        }

        editor.update(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            const command = VOICE_COMMANDS[transcript.toLowerCase().trim()];

            if (command) {
              // Execute voice command
              command({
                editor,
                selection,
              });
            } else if (transcript.match(/\s*\n\s*/)) {
              // Handle line breaks
              selection.insertParagraph();
            } else {
              // Insert the recognized text
              selection.insertText(transcript);
            }
          }
        });
      });

      // Handle errors
      recognition.current.addEventListener('error', (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setIsEnabled(false);
          alert('Microphone access denied. Please allow microphone access to use speech-to-text.');
        }
      });

      // Handle when recognition ends
      recognition.current.addEventListener('end', () => {
        if (isEnabled) {
          // Restart recognition if it's still enabled
          try {
            recognition.current?.start();
          } catch (error) {
            console.warn('Failed to restart speech recognition:', error);
          }
        }
      });
    }

    // Start or stop recognition based on enabled state
    if (recognition.current) {
      if (isEnabled) {
        try {
          recognition.current.start();
        } catch (error) {
          console.warn('Failed to start speech recognition:', error);
        }
      } else {
        recognition.current.stop();
      }
    }

    return () => {
      if (recognition.current !== null) {
        recognition.current.stop();
      }
    };
  }, [SpeechRecognitionClass, editor, isEnabled, report]);

  // Register the speech to text command
  useEffect(() => {
    return editor.registerCommand(
      SPEECH_TO_TEXT_COMMAND,
      (_isEnabled: boolean) => {
        setIsEnabled(_isEnabled);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}

// Export the plugin only if speech recognition is supported
const SpeechToTextPluginComponent = SUPPORT_SPEECH_RECOGNITION
  ? SpeechToTextPlugin
  : () => null;

export default SpeechToTextPluginComponent;