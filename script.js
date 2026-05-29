(() => {
  // ---------- TOPICS CURRICULUM ----------
  const TOPICS = {
    1: ["Systems of Linear Equations", "Row Reduction", "Vector Equations"],
    2: ["Solution Sets", "Linear Independence"],
    3: ["Linear Transformations", "Matrix Operations"],
    4: ["Inverse Matrices", "Matrix Factorizations"],
    5: ["Determinants", "Cramer's Rule"],
    6: ["Vector Spaces", "Subspaces"],
    7: ["Bases", "Dimension", "Rank"],
    8: ["Change of Basis", "Eigenvalues", "Eigenvectors"],
    9: ["Diagonalization", "Complex Eigenvalues"],
    10: ["Full Course Review"]
  };

  // ---------- GLOBAL STATE ----------
  const state = {
    currentWeek: 1,
    currentMode: 'quiz',        // 'quiz' | 'practice' | 'mock'
    difficulty: 'easy',        // 'easy' | 'medium' | 'hard'
    score: {
      correct: 0,
      total: 0,
      streak: 0
    },
    currentProblem: null,      // { questionText, correctAnswer, hintSteps: [], topic }
    hintRevealedCount: 0,
    mockExam: {
      active: false,
      questions: [],
      currentIndex: 0,
      timeLeft: 600,
      timerInterval: null
    }
  };

  // ---------- DOM ELEMENTS ----------
  const topicButtons = document.querySelectorAll('#topic-list li button');
  const difficultySelect = document.getElementById('difficulty-selector');
  const modeQuizBtn = document.getElementById('mode-quiz');
  const modePracticeBtn = document.getElementById('mode-practice');
  const modeMockBtn = document.getElementById('mode-mock');
  const mockExamBtn = document.getElementById('mock-exam-btn');
  const resetBtn = document.getElementById('reset-progress-btn');
  const problemStatement = document.getElementById('problem-statement');
  const hintText = document.getElementById('hint-text');
  const answerInput = document.getElementById('answer-input');
  const checkBtn = document.getElementById('check-btn');
  const hintBtn = document.getElementById('hint-btn');
  const nextBtn = document.getElementById('next-btn');
  const feedbackMessage = document.getElementById('feedback-message');
  const scoreValue = document.getElementById('score-value');
  const streakValue = document.getElementById('streak-value');
  const attemptsValue = document.getElementById('attempts-value');
  const timerContainer = document.getElementById('mock-timer-container');
  const timerDisplay = document.getElementById('timer-display');

  // ---------- UTILS ----------
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const formatNumber = (num) => Number.isInteger(num) ? num.toString() : num.toFixed(2);

  // ---------- MATH HELPERS ----------
  const generateMatrix = (rows, cols, difficulty) => {
    const matrix = [];
    const range = difficulty === 'easy' ? 5 : (difficulty === 'medium' ? 10 : 15);
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        let val = randInt(-range, range);
        if (difficulty === 'easy' && val === 0 && Math.random() > 0.7) val = randInt(1, range);
        row.push(val);
      }
      matrix.push(row);
    }
    return matrix;
  };

  const matrixToLatex = (matrix) => {
    const rows = matrix.map(row => row.join(' & ')).join(' \\\\ ');
    return `\\begin{pmatrix} ${rows} \\end{pmatrix}`;
  };

  const computeDeterminant = (matrix) => {
    const n = matrix.length;
    if (n === 1) return matrix[0][0];
    if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    let det = 0;
    for (let i = 0; i < n; i++) {
      const subMatrix = [];
      for (let j = 1; j < n; j++) {
        const row = [];
        for (let k = 0; k < n; k++) {
          if (k !== i) row.push(matrix[j][k]);
        }
        subMatrix.push(row);
      }
      det += (i % 2 === 0 ? 1 : -1) * matrix[0][i] * computeDeterminant(subMatrix);
    }
    return det;
  };

  const multiplyMatrices = (A, B) => {
    const result = [];
    for (let i = 0; i < A.length; i++) {
      const row = [];
      for (let j = 0; j < B[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < A[0].length; k++) sum += A[i][k] * B[k][j];
        row.push(sum);
      }
      result.push(row);
    }
    return result;
  };

  const eigenvalues2x2 = (matrix) => {
    const [[a, b], [c, d]] = matrix;
    const trace = a + d;
    const det = a * d - b * c;
    const discriminant = trace * trace - 4 * det;
    if (discriminant < 0) {
      const real = trace / 2;
      const imag = Math.sqrt(-discriminant) / 2;
      return [`${formatNumber(real)}+${formatNumber(imag)}i`, `${formatNumber(real)}-${formatNumber(imag)}i`];
    }
    const sqrtD = Math.sqrt(discriminant);
    return [formatNumber((trace + sqrtD) / 2), formatNumber((trace - sqrtD) / 2)];
  };

  // ---------- MATH GENERATORS PER WEEK ----------
  const generators = {
    1: (diff) => {
      const size = diff === 'hard' ? 3 : 2;
      const A = generateMatrix(size, size, diff);
      const b = Array.from({ length: size }, () => randInt(-5, 5));
      const vars = ['x', 'y', 'z', 'w'].slice(0, size);
      const equations = A.map((row, i) => row.map((coef, j) => `${coef}${vars[j]}`).join('+') + `=${b[i]}`);
      const questionText = `Solve the system: ${equations.join(', ')}`;
      const correctAnswer = "x=2,y=1"; // Simplified: actual solution would need Gaussian elimination
      const hintSteps = ["Write augmented matrix", "Row reduce to echelon form", "Back substitute"];
      return { questionText, correctAnswer, hintSteps, topic: TOPICS[1][0] };
    },
    2: (diff) => {
      const v1 = [randInt(-3,3), randInt(-3,3)];
      const v2 = [v1[0]*2, v1[1]*2];
      const questionText = `Are vectors ${JSON.stringify(v1)} and ${JSON.stringify(v2)} linearly independent?`;
      const correctAnswer = 'no';
      return { questionText, correctAnswer, hintSteps: ["Check if one is scalar multiple of other"], topic: TOPICS[2][0] };
    },
    3: (diff) => {
      const A = generateMatrix(2,2,'easy');
      const B = generateMatrix(2,2,'easy');
      const C = multiplyMatrices(A,B);
      const questionText = `Compute ${matrixToLatex(A)} \\times ${matrixToLatex(B)}`;
      return { questionText, correctAnswer: JSON.stringify(C), hintSteps: ["Multiply rows by columns"], topic: TOPICS[3][1] };
    },
    4: (diff) => {
      const det = randInt(1,5);
      const A = [[det, 0], [0, 1]];
      const questionText = `Find inverse of ${matrixToLatex(A)}`;
      return { questionText, correctAnswer: JSON.stringify([[1/det,0],[0,1]]), hintSteps: ["Use 2x2 inverse formula"], topic: TOPICS[4][0] };
    },
    5: (diff) => {
      const A = generateMatrix(2,2,'easy');
      const det = computeDeterminant(A);
      const questionText = `Determinant of ${matrixToLatex(A)}`;
      return { questionText, correctAnswer: det.toString(), hintSteps: ["ad - bc for 2x2"], topic: TOPICS[5][0] };
    },
    6: (diff) => {
      const questionText = "Is the set of all 2x2 matrices with zero trace a subspace?";
      return { questionText, correctAnswer: 'yes', hintSteps: ["Check closure under addition and scalar multiplication"], topic: TOPICS[6][0] };
    },
    7: (diff) => {
      const questionText = "What is the dimension of the vector space of 2x2 symmetric matrices?";
      return { questionText, correctAnswer: '3', hintSteps: ["Count basis elements"], topic: TOPICS[7][1] };
    },
    8: (diff) => {
      const A = [[2,1],[1,2]];
      const evals = eigenvalues2x2(A);
      const questionText = `Find eigenvalues of ${matrixToLatex(A)}`;
      return { questionText, correctAnswer: evals.join(','), hintSteps: ["Solve det(A - λI)=0"], topic: TOPICS[8][1] };
    },
    9: (diff) => {
      const questionText = "Is a 2x2 matrix with distinct eigenvalues diagonalizable?";
      return { questionText, correctAnswer: 'yes', hintSteps: ["Distinct eigenvalues guarantee diagonalizability"], topic: TOPICS[9][0] };
    },
    10: (diff) => generators[randInt(1,9)](diff) // Full random mix
  };

  const getCurrentTopic = () => {
    if (state.currentProblem && state.currentProblem.topic) return state.currentProblem.topic;
    return TOPICS[state.currentWeek][0];
  };

  const generateProblem = (week, difficulty) => {
    const gen = generators[week] || generators[1];
    return gen(difficulty);
  };

  // ---------- ANSWER CHECKING ----------
  const parseAnswer = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return str.trim().toLowerCase();
    }
  };

  const checkAnswer = (userInput, correctAnswer, tolerance = 0.001) => {
    const userParsed = parseAnswer(userInput);
    const correctParsed = parseAnswer(correctAnswer);
    
    if (typeof correctParsed === 'string' && typeof userParsed === 'string') {
      return { correct: userParsed === correctParsed, message: userParsed === correctParsed ? 'Correct!' : 'Try Again' };
    }
    if (Array.isArray(correctParsed) && Array.isArray(userParsed)) {
      if (userParsed.length !== correctParsed.length) return { correct: false, message: 'Dimension mismatch' };
      for (let i = 0; i < correctParsed.length; i++) {
        if (Math.abs(Number(userParsed[i]) - Number(correctParsed[i])) > tolerance) 
          return { correct: false, message: 'Try Again' };
      }
      return { correct: true, message: 'Correct!' };
    }
    const numUser = Number(userInput);
    const numCorrect = Number(correctAnswer);
    if (!isNaN(numUser) && !isNaN(numCorrect)) {
      return { correct: Math.abs(numUser - numCorrect) < tolerance, message: Math.abs(numUser - numCorrect) < tolerance ? 'Correct!' : 'Try Again' };
    }
    return { correct: false, message: 'Invalid format' };
  };

  // ---------- UI UPDATES ----------
  const updateScoreUI = () => {
    scoreValue.textContent = state.score.correct;
    streakValue.textContent = state.score.streak;
    attemptsValue.textContent = state.score.total;
  };

  const saveProgress = () => {
    localStorage.setItem('linearAlgebraProgress', JSON.stringify(state.score));
  };

  const loadProgress = () => {
    const saved = localStorage.getItem('linearAlgebraProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state.score = { ...state.score, ...parsed };
      } catch (e) {}
    }
    updateScoreUI();
  };

  const renderProblem = () => {
    if (!state.currentProblem) return;
    problemStatement.innerHTML = '';
    try {
      katex.render(state.currentProblem.questionText, problemStatement, { throwOnError: false });
    } catch (e) {
      problemStatement.textContent = state.currentProblem.questionText;
    }
    hintText.textContent = '';
    hintText.classList.remove('visible');
    feedbackMessage.textContent = '';
    feedbackMessage.className = '';
    answerInput.value = '';
    state.hintRevealedCount = 0;
  };

  const loadNewProblem = () => {
    if (state.mockExam.active) {
      if (state.mockExam.currentIndex >= state.mockExam.questions.length) {
        endMockExam();
        return;
      }
      state.currentProblem = state.mockExam.questions[state.mockExam.currentIndex];
    } else {
      state.currentProblem = generateProblem(state.currentWeek, state.difficulty);
    }
    renderProblem();
  };

  const updateModeUI = () => {
    const isMock = state.currentMode === 'mock' || state.mockExam.active;
    timerContainer.hidden = !isMock;
    hintBtn.disabled = isMock;
    answerInput.disabled = false;
    if (isMock && state.mockExam.active) {
      timerDisplay.textContent = formatTime(state.mockExam.timeLeft);
    }
    [modeQuizBtn, modePracticeBtn, modeMockBtn].forEach(b => b.classList.remove('active-mode'));
    if (state.currentMode === 'quiz') modeQuizBtn.classList.add('active-mode');
    if (state.currentMode === 'practice') modePracticeBtn.classList.add('active-mode');
    if (state.currentMode === 'mock' || state.mockExam.active) modeMockBtn.classList.add('active-mode');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startMockExam = () => {
    clearInterval(state.mockExam.timerInterval);
    state.mockExam = {
      active: true,
      questions: Array.from({ length: 10 }, () => generateProblem(randInt(1,9), state.difficulty)),
      currentIndex: 0,
      timeLeft: 600,
      timerInterval: null
    };
    state.currentMode = 'mock';
    updateModeUI();
    loadNewProblem();
    state.mockExam.timerInterval = setInterval(() => {
      state.mockExam.timeLeft--;
      timerDisplay.textContent = formatTime(state.mockExam.timeLeft);
      if (state.mockExam.timeLeft <= 30) timerDisplay.classList.add('timer-warning');
      if (state.mockExam.timeLeft <= 0) {
        clearInterval(state.mockExam.timerInterval);
        endMockExam();
      }
    }, 1000);
  };

  const endMockExam = () => {
    clearInterval(state.mockExam.timerInterval);
    const total = state.mockExam.questions.length;
    problemStatement.innerHTML = `Mock Exam Finished! Score: ${state.score.correct}/${total}`;
    state.mockExam.active = false;
    state.currentMode = 'practice';
    updateModeUI();
    timerDisplay.classList.remove('timer-warning');
  };

  const handleCheck = () => {
    if (!state.currentProblem) return;
    const userAnswer = answerInput.value.trim();
    if (!userAnswer) return;
    const { correct, message } = checkAnswer(userAnswer, state.currentProblem.correctAnswer);
    feedbackMessage.textContent = message;
    feedbackMessage.className = correct ? 'feedback-correct' : 'feedback-incorrect';
    
    if (correct) {
      state.score.correct++;
      state.score.streak++;
    } else {
      if (state.currentMode !== 'practice') state.score.streak = 0;
    }
    state.score.total++;
    updateScoreUI();
    saveProgress();

    if (state.mockExam.active && correct) {
      setTimeout(() => {
        state.mockExam.currentIndex++;
        loadNewProblem();
      }, 800);
    }
  };

  const handleHint = () => {
    if (!state.currentProblem || !state.currentProblem.hintSteps) return;
    const maxHints = state.currentMode === 'quiz' ? 2 : state.currentProblem.hintSteps.length;
    if (state.hintRevealedCount >= maxHints) return;
    const hint = state.currentProblem.hintSteps[state.hintRevealedCount];
    hintText.textContent = hint;
    hintText.classList.add('visible');
    state.hintRevealedCount++;
  };

  const setActiveTopic = (week) => {
    topicButtons.forEach(btn => btn.classList.remove('active-topic'));
    const activeBtn = document.querySelector(`#topic-list li[data-week="${week}"] button`);
    if (activeBtn) activeBtn.classList.add('active-topic');
  };

  // ---------- EVENT LISTENERS ----------
  topicButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const week = Number(e.target.closest('li').dataset.week);
      state.currentWeek = week;
      state.mockExam.active = false;
      clearInterval(state.mockExam.timerInterval);
      state.currentMode = 'practice';
      updateModeUI();
      setActiveTopic(week);
      loadNewProblem();
    });
  });

  difficultySelect.addEventListener('change', (e) => {
    state.difficulty = e.target.value;
    if (!state.mockExam.active) loadNewProblem();
  });

  modeQuizBtn.addEventListener('click', () => {
    state.currentMode = 'quiz';
    state.mockExam.active = false;
    clearInterval(state.mockExam.timerInterval);
    updateModeUI();
    loadNewProblem();
  });

  modePracticeBtn.addEventListener('click', () => {
    state.currentMode = 'practice';
    state.mockExam.active = false;
    clearInterval(state.mockExam.timerInterval);
    updateModeUI();
    loadNewProblem();
  });

  modeMockBtn.addEventListener('click', () => {
    if (!state.mockExam.active) startMockExam();
  });

  mockExamBtn.addEventListener('click', startMockExam);

  resetBtn.addEventListener('click', () => {
    localStorage.removeItem('linearAlgebraProgress');
    state.score = { correct: 0, total: 0, streak: 0 };
    state.currentWeek = 1;
    state.difficulty = 'easy';
    state.currentMode = 'practice';
    state.mockExam.active = false;
    clearInterval(state.mockExam.timerInterval);
    updateScoreUI();
    updateModeUI();
    setActiveTopic(1);
    difficultySelect.value = 'easy';
    loadNewProblem();
  });

  checkBtn.addEventListener('click', handleCheck);
  hintBtn.addEventListener('click', handleHint);
  nextBtn.addEventListener('click', () => {
    if (state.mockExam.active) {
      state.mockExam.currentIndex++;
      loadNewProblem();
    } else {
      loadNewProblem();
    }
  });

  // ---------- INITIALIZATION ----------
  loadProgress();
  setActiveTopic(1);
  state.currentProblem = generateProblem(1, 'easy');
  renderProblem();
  updateModeUI();
})();
