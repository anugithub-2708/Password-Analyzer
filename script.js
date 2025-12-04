// DOM Elements
const passwordInput = document.getElementById('passwordInput');
const togglePassword = document.getElementById('togglePassword');
const strengthProgress = document.getElementById('strengthProgress');
const strengthLabel = document.getElementById('strengthLabel');
const suggestionsList = document.getElementById('suggestionsList');
const breachWarning = document.getElementById('breachWarning');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');

// Configuration
const COMMON_PASSWORDS = [
    'password123', 'admin', 'qwerty123', 'iloveyou', 'welcome', '123456',
    'password', '12345678', '123456789', 'letmein'
];

const STRENGTH_LEVELS = [
    { label: 'Very Weak', color: 'var(--strength-very-weak)', width: '20%' },
    { label: 'Weak', color: 'var(--strength-weak)', width: '40%' },
    { label: 'Medium', color: 'var(--strength-medium)', width: '60%' },
    { label: 'Strong', color: 'var(--strength-strong)', width: '80%' },
    { label: 'Very Strong', color: 'var(--strength-very-strong)', width: '100%' }
];

// Event Listeners
passwordInput.addEventListener('input', analyzePassword);
togglePassword.addEventListener('click', toggleVisibility);
generateBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', copyToClipboard);

/**
 * Main function to analyze password strength
 */
function analyzePassword() {
    const password = passwordInput.value;
    
    // Reset if empty
    if (!password) {
        resetUI();
        return;
    }

    // 1. Check for Breach
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        showBreachWarning();
        setStrength(0); // Force Very Weak
        return;
    } else {
        hideBreachWarning();
    }

    // 2. Calculate Score
    let score = 0;
    let suggestions = [];

    // Length Check
    if (password.length > 12) score += 25;
    else if (password.length >= 8) score += 15;
    else suggestions.push("Increase length to at least 8 characters");

    // Character Types Check
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (hasLower) score += 10;
    if (hasUpper) score += 15;
    else suggestions.push("Add uppercase letters");
    
    if (hasNumber) score += 15;
    else suggestions.push("Add numbers");
    
    if (hasSpecial) score += 20;
    else suggestions.push("Add special characters (@, #, $, etc.)");

    // Bonus for variety
    if (hasLower && hasUpper && hasNumber && hasSpecial) score += 15;

    // Deductions for Patterns
    if (/(.)\1{2,}/.test(password)) { // Repeats like 'aaa'
        score -= 10;
        suggestions.push("Avoid repeating characters");
    }
    
    if (hasSequentialPattern(password)) {
        score -= 15;
        suggestions.push("Avoid sequential patterns (e.g., 123, abc)");
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // 3. Determine Level
    let levelIndex = 0;
    if (score < 20) levelIndex = 0;
    else if (score < 40) levelIndex = 1;
    else if (score < 60) levelIndex = 2;
    else if (score < 80) levelIndex = 3;
    else levelIndex = 4;

    // 4. Update UI
    setStrength(levelIndex);
    updateSuggestions(suggestions);
}

/**
 * Checks for sequential patterns like '123' or 'abc'
 */
function hasSequentialPattern(password) {
    const sequences = ['12345', 'abcde', 'qwerty', 'asdfgh', 'zxcvbn'];
    for (let seq of sequences) {
        if (password.toLowerCase().includes(seq)) return true;
        // Check reverse too
        if (password.toLowerCase().includes(seq.split('').reverse().join(''))) return true;
    }
    return false;
}

/**
 * Updates the strength meter UI
 */
function setStrength(index) {
    const level = STRENGTH_LEVELS[index];
    strengthProgress.style.width = level.width;
    strengthProgress.style.backgroundColor = level.color;
    strengthLabel.textContent = level.label;
    strengthLabel.style.color = level.color;
}

/**
 * Updates the suggestions list
 */
function updateSuggestions(suggestions) {
    suggestionsList.innerHTML = '';
    suggestions.forEach(msg => {
        const li = document.createElement('li');
        li.textContent = msg;
        suggestionsList.appendChild(li);
    });
}

/**
 * Shows breach warning
 */
function showBreachWarning() {
    breachWarning.classList.remove('hidden');
    breachWarning.classList.add('shake');
    setTimeout(() => breachWarning.classList.remove('shake'), 500);
}

function hideBreachWarning() {
    breachWarning.classList.add('hidden');
}

/**
 * Resets the UI to initial state
 */
function resetUI() {
    strengthProgress.style.width = '0%';
    strengthProgress.style.backgroundColor = 'transparent';
    strengthLabel.textContent = 'None';
    strengthLabel.style.color = 'var(--text-muted)';
    suggestionsList.innerHTML = '';
    hideBreachWarning();
}

/**
 * Generates a random strong password
 */
function generatePassword() {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let retVal = "";
    
    // Ensure at least one of each type
    retVal += "A"; // Upper
    retVal += "a"; // Lower
    retVal += "1"; // Number
    retVal += "!"; // Special

    for (let i = 0, n = charset.length; i < length - 4; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    
    // Shuffle
    retVal = retVal.split('').sort(() => 0.5 - Math.random()).join('');
    
    passwordInput.value = retVal;
    analyzePassword(); // Trigger analysis
}

/**
 * Copies password to clipboard
 */
function copyToClipboard() {
    if (!passwordInput.value) return;
    
    navigator.clipboard.writeText(passwordInput.value).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
}

/**
 * Toggles password visibility
 */
function toggleVisibility() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle icon
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
}
