import { $command } from "@milkdown/kit/utils";

export const aiCommand = $command("AICommand", () => () => {
  // Placeholder for AI functionality
  console.log("AI command executed - functionality coming soon!");
  // Return a no-op command for now
  return () => false;
});