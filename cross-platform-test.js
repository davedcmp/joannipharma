const fs = require('fs');
const vm = require('vm');

function makeElement(id) {
  return {
    id,
    value: '',
    innerHTML: '',
    textContent: '',
    dataset: {},
    files: [],
    download: '',
    href: '',
    addEventListener() {},
    reset() {},
    focus() {},
    click() {},
    remove() {},
    classList: { contains() { return false; }, remove() {}, add() {} }
  };
}

function runScenario(platform) {
  const elements = {};
  [
    'inventory-form','item-name','expiration-date','inventory-body','item-count','alert-modal','alert-message',
    'close-modal','export-backup','import-backup','backup-file','generate-report','table-search'
  ].forEach((id) => { elements[id] = makeElement(id); });
  elements['backup-file'].click = function () { this.clicked = true; };
  elements['alert-modal'].classList = { remove() {}, add() {}, contains() { return false; } };

  const storage = new Map();
  const sandbox = {
    console,
    Blob,
    Date,
    Math,
    String,
    Number,
    Array,
    Object,
    JSON,
    RegExp,
    Error,
    TypeError,
    URL: {
      createObjectURL(blob) { sandbox.__lastBlob = blob; return 'blob:test'; },
      revokeObjectURL() {}
    },
    FileReader: class {
      constructor() { this.result = ''; this.onload = null; this.onerror = null; }
      readAsText(file) { this.result = file && file.content ? file.content : ''; if (this.onload) this.onload(); }
    },
    document: {
      getElementById(id) { return elements[id] || makeElement(id); },
      createElement(tag) { return makeElement(tag); },
      body: { appendChild() {} }
    },
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); }
    },
    window: { confirm() { return true; } }
  };

  if (platform === 'windows') {
    const NotificationCtor = function (title, options) { sandbox.__lastNotification = { title, options }; };
    NotificationCtor.permission = 'granted';
    NotificationCtor.requestPermission = async () => 'granted';
    sandbox.Notification = NotificationCtor;
    sandbox.window.Notification = NotificationCtor;
  } else if (platform === 'android') {
    const NotificationCtor = function () { throw new TypeError("Failed to construct 'Notification': Illegal constructor. Use ServiceWorkerRegistration.showNotification() instead"); };
    NotificationCtor.permission = 'granted';
    NotificationCtor.requestPermission = async () => 'granted';
    sandbox.Notification = NotificationCtor;
    sandbox.window.Notification = NotificationCtor;
  } else {
    sandbox.Notification = undefined;
  }

  const context = vm.createContext(sandbox);
  const appSource = fs.readFileSync('script.js', 'utf8');
  vm.runInContext(appSource, context, { filename: 'script.js' });

  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const soon = new Date(today); soon.setDate(soon.getDate() + 5);
  const valid = new Date(today); valid.setDate(valid.getDate() + 60);

  function addItem(name, dateText) {
    elements['item-name'].value = name;
    elements['expiration-date'].value = dateText;
    context.onFormSubmit({ preventDefault() {} });
  }

  addItem('Amoxicillin', fmt(soon));
  addItem('Vitamin C', fmt(valid));

  assert(elements['inventory-body'].innerHTML.includes('Amoxicillin'), `${platform}: table render failed`);

  context.onSearchInput({ target: { value: 'expiring soon' } });
  assert(elements['inventory-body'].innerHTML.includes('Amoxicillin'), `${platform}: status search failed`);

  context.onSearchInput({ target: { value: '' } });
  context.onGenerateReport();
  context.onExportBackup();

  context.checkExpirationsAndNotify();
  if (platform === 'windows') {
    assert(sandbox.__lastNotification && sandbox.__lastNotification.title === 'Pharmacy Expiration Alert', 'windows: notification should be used');
  }
  if (platform === 'android' || platform === 'ios') {
    assert(elements['alert-message'].textContent.length > 0, `${platform}: fallback in-app alert expected`);
  }

  const csv = '"Item Name","Expiration Date"\n"Imported Drug","2031-01-02"';
  context.onBackupFileSelected({ target: { files: [{ content: csv }] } });
  assert(elements['inventory-body'].innerHTML.includes('Imported Drug'), `${platform}: CSV import failed`);

  console.log(`PASS ${platform}`);
}

const platform = process.argv[2];
try {
  runScenario(platform);
} catch (error) {
  console.error(`FAIL ${platform}:`, error.message);
  process.exit(1);
}
