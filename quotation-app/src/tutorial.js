const tutorialKey = 'stoneric-quotation-tutorial-complete';

export function initializeTutorial({ startNewQuotation }) {
  const tutorial = document.getElementById('tutorial');
  const spotlight = document.getElementById('tutorialSpotlight');
  const card = document.getElementById('tutorialCard');
  const title = document.getElementById('tutorialTitle');
  const text = document.getElementById('tutorialText');
  const stepCount = document.getElementById('tutorialStepCount');
  const nextBtn = document.getElementById('tutorialNextBtn');
  const backBtn = document.getElementById('tutorialBackBtn');
  const skipBtn = document.getElementById('tutorialSkipBtn');
  let stepIndex = 0;

  const steps = [
    {
      target: '#startQuotationBtn',
      title: 'Start a quotation',
      text: 'Begin with a blank quotation here. I will walk you through the important parts before you start working.',
      next: startNewQuotation
    },
    {
      target: '#toolbarOpenQuotationBtn',
      title: 'Open an existing quotation',
      text: 'Use Open file whenever you have a saved Stoneric quotation file. Your client details, items, totals, and settings will be restored.'
    },
    {
      target: '.meta-row',
      title: 'Add client details',
      text: 'Enter the company, address, contact person, email, and quotation date here. Changes are saved automatically on this device.'
    },
    {
      target: '#itemsBody tr:first-child',
      title: 'Add quotation items',
      text: 'Each row is an item. Add its description, quantity, unit, and unit price. Use Add item below the table for more rows.'
    },
    {
      target: '.toggle-row-total',
      title: 'Exclude a row from totals',
      text: 'Rows are included by default. Hover the row total and use the minus button when you want to show a unit price without adding that row to the quotation total.'
    },
    {
      target: '.totals',
      title: 'Review the totals',
      text: 'The subtotal, VAT, and grand total update automatically as you edit quantities, prices, and the VAT percentage.'
    },
    {
      target: '#saveQuotationBtn',
      title: 'Save your quotation file',
      text: 'Save file downloads a portable quotation file you can open later on this or another device. Your current draft is also saved automatically here.'
    },
    {
      target: '#downloadBtn',
      title: 'Export the finished PDF',
      text: 'When the quotation is ready, Download PDF creates the client-facing quotation. You can return home at any time to resume or open another file.'
    }
  ];

  function finish() {
    localStorage.setItem(tutorialKey, 'true');
    tutorial.hidden = true;
    document.body.classList.remove('tutorial-active');
  }

  function positionCard(bounds) {
    const cardWidth = Math.min(330, window.innerWidth - 32);
    const gap = 18;
    let left = bounds.left + (bounds.width / 2) - (cardWidth / 2);
    let top = bounds.bottom + gap;
    if (top + card.offsetHeight > window.innerHeight - 16) top = bounds.top - card.offsetHeight - gap;
    left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));
    top = Math.max(16, top);
    card.style.width = `${cardWidth}px`;
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  function render() {
    const step = steps[stepIndex];
    const target = document.querySelector(step.target);
    if (!target) {
      if (stepIndex < steps.length - 1) {
        stepIndex += 1;
        render();
      } else finish();
      return;
    }
    const bounds = target.getBoundingClientRect();
    spotlight.style.left = `${bounds.left - 6}px`;
    spotlight.style.top = `${bounds.top - 6}px`;
    spotlight.style.width = `${bounds.width + 12}px`;
    spotlight.style.height = `${bounds.height + 12}px`;
    title.textContent = step.title;
    text.textContent = step.text;
    stepCount.textContent = `${stepIndex + 1} of ${steps.length}`;
    backBtn.hidden = stepIndex === 0;
    nextBtn.textContent = stepIndex === steps.length - 1 ? 'Finish' : 'Next';
    requestAnimationFrame(() => positionCard(bounds));
  }

  function start() {
    if (localStorage.getItem(tutorialKey)) return;
    tutorial.hidden = false;
    document.body.classList.add('tutorial-active');
    render();
  }

  nextBtn.addEventListener('click', () => {
    const step = steps[stepIndex];
    if (step.next) step.next();
    if (stepIndex === steps.length - 1) finish();
    else {
      stepIndex += 1;
      render();
    }
  });
  backBtn.addEventListener('click', () => {
    if (stepIndex > 0) {
      stepIndex -= 1;
      render();
    }
  });
  skipBtn.addEventListener('click', finish);
  window.addEventListener('resize', () => {
    if (!tutorial.hidden) render();
  });

  return { start };
}