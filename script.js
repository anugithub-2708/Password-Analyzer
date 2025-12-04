document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const passwordInput = document.getElementById('passwordInput');
    const toggleVisibilityBtn = document.getElementById('toggleVisibility');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    
    const resultsSection = document.getElementById('results');
    const strengthText = document.getElementById('strengthText');
    const progressBar = document.getElementById('progressBar');
    const crackTimeDisplay = document.getElementById('crackTime');
    const suggestionsList = document.getElementById('suggestionsList');
    const personalInfoWarning = document.getElementById('personalInfoWarning');

    // Personal Info Inputs
    const nameInput = document.getElementById('name');
    const birthYearInput = document.getElementById('birthYear');
    const mobileInput = document.getElementById('mobile');
    const favWordInput = document.getElementById('favWord');

    // Constants
    const COMMON_PATTERNS = ['password', 'qwerty', '12345', '123456', 'admin', 'welcome', 'login'];
    const STRENGTH_LEVELS = [
        { label: 'Very Weak', color: 'var(--color-very-weak)', width: '20%' },
        { label: 'Weak', color: 'var(--color-weak)', width: '40%' },
        { label: 'Medium', color: 'var(--color-medium)', width: '60%' },
        { label: 'Strong', color: 'var(--color-strong)', width: '80%' },
        { label: 'Very Strong', color: 'var(--color-very-strong)', width: '100%' }
    ];

    // Event Listeners
    passwordInput.addEventListener('input', analyzePassword);
    [nameInput, birthYearInput, mobileInput, favWordInput].forEach(input => {
        input.addEventListener('input', () => {
            if (passwordInput.value) analyzePassword();
        });
    });

    toggleVisibilityBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        // Update icon
        toggleVisibilityBtn.querySelector('.eye-icon').textContent = type === 'password' ? '👁️' : '🙈';
    });

    generateBtn.addEventListener('click', () => {
        const newPassword = generateSecurePassword();
        passwordInput.value = newPassword;
        analyzePassword();
    });

    copyBtn.addEventListener('click', () => {
        if (!passwordInput.value) return;
        navigator.clipboard.writeText(passwordInput.value).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => copyBtn.textContent = originalText, 2000);
        });
    });

    // Main Analysis Function
    function analyzePassword() {
        const password = passwordInput.value;
        
        if (!password) {
            resultsSection.style.display = 'none';
            return;
        }
        resultsSection.style.display = 'block';

        let score = 0;
        let suggestions = [];
        
        // 1. Length Check
        if (password.length > 12) score += 25;
        else if (password.length >= 8) score += 15;
        else suggestions.push("Make your password at least 8 characters long (12+ is better).");

        // 2. Character Types
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        if (hasLower) score += 10; else suggestions.push("Add lowercase letters.");
        if (hasUpper) score += 15; else suggestions.push("Add uppercase letters.");
        if (hasNumber) score += 15; else suggestions.push("Add numbers.");
        if (hasSpecial) score += 20; else suggestions.push("Add special characters (@, #, $, etc.).");

        // 3. Repeats & Patterns
        if (/(.)\1{2,}/.test(password)) {
            score -= 10;
            suggestions.push("Avoid repeating characters (e.g., 'aaa').");
        }
        
        // Sequential patterns (simple check)
        const sequences = ['123', '234', '345', '456', '567', '678', '789', 'abc', 'bcd', 'cde', 'xyz'];
        if (sequences.some(seq => password.toLowerCase().includes(seq))) {
            score -= 15;
            suggestions.push("Avoid sequential patterns like '123' or 'abc'.");
        }

        // Common weak patterns
        if (COMMON_PATTERNS.some(pat => password.toLowerCase().includes(pat))) {
            score -= 20;
            suggestions.push("Avoid common words like 'password' or 'qwerty'.");
        }

        // 4. Personal Information Check
        const personalInfoFound = checkPersonalInfo(password);
        if (personalInfoFound) {
            score -= 30; // Significant penalty
            personalInfoWarning.style.display = 'block';
            suggestions.push("Remove personal information.");
        } else {
            personalInfoWarning.style.display = 'none';
        }

        // Clamp score between 0 and 100
        score = Math.max(0, Math.min(100, score));

        // Determine Level
        let levelIndex = 0;
        if (score < 20) levelIndex = 0;
        else if (score < 40) levelIndex = 1;
        else if (score < 60) levelIndex = 2;
        else if (score < 80) levelIndex = 3;
        else levelIndex = 4;

        updateUI(levelIndex, suggestions);
        estimateCrackTime(password, score);
    }

    // Check if personal info is present in password
    function checkPersonalInfo(password) {
        const info = [
            nameInput.value,
            birthYearInput.value,
            mobileInput.value,
            favWordInput.value
        ].filter(val => val && val.length > 2); // Only check if input has > 2 chars

        const lowerPwd = password.toLowerCase();
        return info.some(item => lowerPwd.includes(item.toLowerCase()));
    }

    // Update UI Elements
    function updateUI(levelIndex, suggestions) {
        const level = STRENGTH_LEVELS[levelIndex];
        
        strengthText.textContent = level.label;
        strengthText.style.color = level.color;
        
        progressBar.style.width = level.width;
        progressBar.style.backgroundColor = level.color;

        // Update suggestions
        suggestionsList.innerHTML = '';
        if (suggestions.length === 0 && levelIndex === 4) {
            const li = document.createElement('li');
            li.textContent = "Great job! This is a very strong password.";
            li.style.color = "var(--color-very-strong)";
            suggestionsList.appendChild(li);
        } else {
            suggestions.forEach(sugg => {
                const li = document.createElement('li');
                li.textContent = sugg;
                suggestionsList.appendChild(li);
            });
        }
    }

    // Estimate Crack Time
    function estimateCrackTime(password, score) {
        // Calculate Entropy roughly
        let poolSize = 0;
        if (/[a-z]/.test(password)) poolSize += 26;
        if (/[A-Z]/.test(password)) poolSize += 26;
        if (/[0-9]/.test(password)) poolSize += 10;
        if (/[^A-Za-z0-9]/.test(password)) poolSize += 32;

        if (poolSize === 0) {
            crackTimeDisplay.textContent = 'Instant';
            return;
        }

        const entropy = password.length * Math.log2(poolSize);
        
        // Assume attacker can try 10 billion guesses per second (high-end GPU array)
        // This is a simplification for educational purposes
        const guessesPerSecond = 1e10; 
        const seconds = Math.pow(2, entropy) / guessesPerSecond;

        let timeString = '';
        if (seconds < 1) timeString = '< 1 second';
        else if (seconds < 60) timeString = `${Math.round(seconds)} seconds`;
        else if (seconds < 3600) timeString = `${Math.round(seconds / 60)} minutes`;
        else if (seconds < 86400) timeString = `${Math.round(seconds / 3600)} hours`;
        else if (seconds < 2592000) timeString = `${Math.round(seconds / 86400)} days`;
        else if (seconds < 31536000) timeString = `${Math.round(seconds / 2592000)} months`;
        else if (seconds < 3153600000) timeString = `${Math.round(seconds / 31536000)} years`;
        else timeString = 'Centuries';

        // Adjust based on score/weakness (if score is low, reduce time drastically)
        if (score < 40 && seconds > 86400) {
             // If weak but long, it might still be crackable via dictionary attacks not fully captured by entropy
             timeString = 'Few minutes (Dictionary Attack)';
        }

        crackTimeDisplay.textContent = timeString;
    }

    // Generate Secure Password
    function generateSecurePassword() {
        const length = 16;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
        let retVal = "";
        // Ensure at least one of each type
        retVal += "A"; // Upper
        retVal += "a"; // Lower
        retVal += "1"; // Number
        retVal += "!"; // Special
        
        for (let i = 4, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        
        // Shuffle
        return retVal.split('').sort(() => 0.5 - Math.random()).join('');
    }
});
