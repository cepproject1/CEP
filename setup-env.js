const fs = require('fs');

// Path to your login file
const filePath = './login.html';

console.log('Starting environment setup...');

try {
  // Read the HTML file content
  let htmlContent = fs.readFileSync(filePath, 'utf8');

  // Get the variables from the Railway environment
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    // Replace the placeholders in the HTML content
    htmlContent = htmlContent.replace('__SUPABASE_URL__', supabaseUrl);
    htmlContent = htmlContent.replace('__SUPABASE_ANON_KEY__', supabaseKey);
    
    // Write the modified content back to the file
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    console.log('Successfully injected Supabase environment variables into login.html.');
  } else {
    console.error('Error: PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY not found in environment variables.');
    // Exit with an error code to fail the deployment if keys are missing
    process.exit(1); 
  }
} catch (error) {
  console.error('Failed to process login.html:', error);
  process.exit(1);
}
