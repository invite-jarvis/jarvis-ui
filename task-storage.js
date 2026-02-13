// IndexedDB wrapper for task storage
class TaskStorage {
  constructor() {
    this.dbName = 'clawgpt-tasks-db';
    this.dbVersion = 1;
    this.storeName = 'tasks';
    this.db = null;
    this.useFallback = false;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.warn('IndexedDB not available for tasks, falling back to localStorage');
        this.useFallback = true;
        resolve(null);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('assignee', 'assignee', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('dueDate', 'dueDate', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // Migrate a single old task to the new schema
  _migrateTask(oldTask) {
    return {
      id: oldTask.id || `task-0-${Date.now()}`,
      title: oldTask.title || 'Untitled Task',
      description: (oldTask.metadata && oldTask.metadata.description) || oldTask.description || '',
      status: oldTask.status || 'pending',
      assignee: oldTask.type === 'message_send' ? 'jarvis' : 'user',
      type: oldTask.type || 'manual',
      priority: 'medium',
      dueDate: null,
      tags: oldTask.type === 'message_send' ? ['auto', 'message'] : [],
      subtasks: [],
      dependencies: [],
      notes: [],
      recurrence: 'none',
      recurrenceConfig: null,
      chatId: oldTask.chatId || null,
      createdAt: oldTask.startTime || Date.now(),
      updatedAt: oldTask.endTime || oldTask.startTime || Date.now(),
      startTime: oldTask.startTime || null,
      endTime: oldTask.endTime || null,
      result: oldTask.result || null,
      metadata: oldTask.metadata || {}
    };
  }

  async loadAll() {
    const legacyData = localStorage.getItem('clawgpt-tasks');

    if (this.useFallback) {
      if (!legacyData) return {};
      return this._parseLegacyAndMigrate(legacyData);
    }

    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const tasks = {};
        request.result.forEach(task => {
          tasks[task.id] = task;
        });

        // If IndexedDB is empty but localStorage has data, migrate
        if (Object.keys(tasks).length === 0 && legacyData) {
          const migrated = this._parseLegacyAndMigrate(legacyData);
          this.saveAll(migrated).then(() => {
            localStorage.removeItem('clawgpt-tasks');
            console.log('Migrated tasks from localStorage to IndexedDB');
          });
          resolve(migrated);
        } else {
          resolve(tasks);
        }
      };

      request.onerror = () => {
        console.error('Failed to load tasks from IndexedDB');
        resolve(legacyData ? this._parseLegacyAndMigrate(legacyData) : {});
      };
    });
  }

  _parseLegacyAndMigrate(legacyData) {
    try {
      const data = JSON.parse(legacyData);
      const tasks = {};
      // Old format: { history: [...], manualTasks: [...] }
      const allOld = [...(data.history || []), ...(data.manualTasks || [])];
      const seen = new Set();
      for (const old of allOld) {
        if (old.id && !seen.has(old.id)) {
          seen.add(old.id);
          tasks[old.id] = this._migrateTask(old);
        }
      }
      return tasks;
    } catch (e) {
      console.error('Failed to parse legacy task data:', e);
      return {};
    }
  }

  async saveAll(tasks) {
    if (this.useFallback) {
      localStorage.setItem('clawgpt-tasks-v2', JSON.stringify(tasks));
      return;
    }

    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();

      Object.values(tasks).forEach(task => {
        store.put(task);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        console.error('Failed to save tasks to IndexedDB, using localStorage fallback');
        localStorage.setItem('clawgpt-tasks-v2', JSON.stringify(tasks));
        resolve();
      };
    });
  }

  async saveOne(task) {
    if (this.useFallback) {
      const all = JSON.parse(localStorage.getItem('clawgpt-tasks-v2') || '{}');
      all[task.id] = task;
      localStorage.setItem('clawgpt-tasks-v2', JSON.stringify(all));
      return;
    }

    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.put(task);
      transaction.oncomplete = () => resolve();
      transaction.onerror = (e) => {
        console.error('Failed to save task:', e);
        reject(transaction.error);
      };
    });
  }

  async deleteOne(taskId) {
    if (this.useFallback) {
      const all = JSON.parse(localStorage.getItem('clawgpt-tasks-v2') || '{}');
      delete all[taskId];
      localStorage.setItem('clawgpt-tasks-v2', JSON.stringify(all));
      return;
    }

    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.delete(taskId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getByAssignee(assignee) {
    if (this.useFallback) {
      const all = JSON.parse(localStorage.getItem('clawgpt-tasks-v2') || '{}');
      return Object.values(all).filter(t => t.assignee === assignee);
    }

    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('assignee');
      const request = index.getAll(assignee);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve([]);
    });
  }
}
