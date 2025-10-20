import React from 'react';
import StyledText from './styledText';

// Sample content from your course JSON
const sampleTheoryContent = `Okay, let's break down the \\"Basic Implementation\\" of common searching algorithms in JavaScript. This means focusing on the core logic without optimizations or complex data structures. We'll cover Linear Search and Binary Search.\\n\\n**1. Linear Search (Sequential Search)**\\n\\n*   **Concept:** Linear search is the simplest. It iterates through each element of an array one by one until it finds the target value. If the target is not present, it will reach the end of the array.\\n\\n*   **JavaScript Code:**\\n\\n    \`\`\`javascript\\n    function linearSearch(array, target) {\\n      for (let i = 0; i < array.length; i++) {\\n        if (array[i] === target) {\\n          return i; // Return the index if found\\n        }\\n      }\\n      return -1; // Return -1 if not found\\n    }\\n\\n    // Example Usage:\\n    const myArray = [5, 2, 9, 1, 5, 6];\\n    const targetValue = 9;\\n    const result = linearSearch(myArray, targetValue);\\n\\n    if (result !== -1) {\\n      console.log(\\"Element found at index: \\" + result); // Output: Element found at index: 2\\n    } else {\\n      console.log(\\"Element not found.\\");\\n    }\\n    \`\`\`\\n\\n*   **Explanation:**\\n\\n    1.  The \`linearSearch\` function takes an array and a \`target\` value as input.\\n    2.  It loops through the array using a \`for\` loop.\\n    3.  Inside the loop, it checks if the current element (\`array[i]\`) is equal to the \`target\`.\\n    4.  If a match is found, the function immediately returns the index \`i\` where the element was found.\\n    5.  If the loop completes without finding the \`target\`, the function returns \`-1\` to indicate that the element is not present in the array.`;

export const TestPreprocessing: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Content Preprocessing Test</h1>
            <div className="border rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-2">Sample Course Content (with escaped characters):</h2>
                <StyledText text={sampleTheoryContent} />
            </div>
        </div>
    );
};

export default TestPreprocessing;