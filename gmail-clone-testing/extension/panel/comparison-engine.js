/**
 * Comparison Engine - Dual API execution and intelligent diff generation
 * Executes same API call on both Real and Clone Gmail, then compares responses
 */

/**
 * Default fields to ignore during comparison (auto-generated IDs)
 */
const DEFAULT_IGNORE_FIELDS = [
  'id',
  'labelId',
  'threadId',
  'messageId',
  'historyId',
  'internalDate',
  'sizeEstimate'
];

/**
 * Comparison Engine Class
 * Orchestrates dual API execution and response comparison
 */
export class ComparisonEngine {
  constructor(realApiClient, cloneApiClient) {
    this.realApiClient = realApiClient;
    this.cloneApiClient = cloneApiClient;
  }

  /**
   * Execute same API call on both Real and Clone simultaneously
   * @param {string} endpoint - API endpoint path
   * @param {string} method - HTTP method
   * @param {Object} pathParams - Path parameters (for {id} replacement)
   * @param {Object} queryParams - Query string parameters
   * @param {Object} bodyParams - Request body parameters
   * @returns {Promise<Object>} Results from both APIs
   */
  async executeDual(endpoint, method, pathParams, queryParams, bodyParams) {
    console.log('[Comparison] Executing dual API call:', { endpoint, method });

    const startTime = Date.now();

    try {
      // Execute both API calls in parallel using Promise.all
      const [realResult, cloneResult] = await Promise.all([
        this.realApiClient.executeRequest(endpoint, method, pathParams, queryParams, bodyParams),
        this.cloneApiClient.executeRequest(endpoint, method, pathParams, queryParams, bodyParams)
      ]);

      const dualDuration = Date.now() - startTime;

      console.log('[Comparison] Dual execution completed:', {
        realStatus: realResult.status,
        cloneStatus: cloneResult.status,
        totalDuration: dualDuration
      });

      return {
        real: realResult,
        clone: cloneResult,
        dualDuration: dualDuration
      };

    } catch (error) {
      console.error('[Comparison] Dual execution failed:', error);
      throw new Error(`Dual execution failed: ${error.message}`);
    }
  }

  /**
   * Generate intelligent diff between Real and Clone responses
   * @param {Object} realResponse - Response body from Real Gmail
   * @param {Object} cloneResponse - Response body from Clone Gmail
   * @param {Array<string>} ignoreFields - Field names to ignore (optional)
   * @returns {Object} Diff analysis result
   */
  generateDiff(realResponse, cloneResponse, ignoreFields = DEFAULT_IGNORE_FIELDS) {
    console.log('[Comparison] Generating diff...');

    // Handle null/undefined responses
    if (!realResponse && !cloneResponse) {
      return {
        hasDifferences: false,
        summary: { count: 0, paths: [] },
        details: []
      };
    }

    if (!realResponse || !cloneResponse) {
      return {
        hasDifferences: true,
        summary: { count: 1, paths: ['<root>'] },
        details: [{
          path: '<root>',
          type: 'missing_response',
          real: realResponse,
          clone: cloneResponse,
          severity: 'high'
        }]
      };
    }

    // Compare objects
    const differences = this.compareObjects(realResponse, cloneResponse, '', ignoreFields);

    console.log('[Comparison] Diff analysis complete:', {
      differencesFound: differences.length,
      paths: differences.map(d => d.path)
    });

    return {
      hasDifferences: differences.length > 0,
      summary: {
        count: differences.length,
        paths: differences.map(d => d.path)
      },
      details: differences
    };
  }

  /**
   * Recursively compare two objects
   * @param {*} realObj - Real Gmail object
   * @param {*} cloneObj - Clone Gmail object
   * @param {string} path - Current JSON path (e.g., "labels[0].name")
   * @param {Array<string>} ignoreFields - Fields to ignore
   * @returns {Array<Object>} Array of difference objects
   */
  compareObjects(realObj, cloneObj, path = '', ignoreFields = []) {
    const differences = [];

    // Type mismatch
    const realType = this.getType(realObj);
    const cloneType = this.getType(cloneObj);

    if (realType !== cloneType) {
      differences.push({
        path: path || '<root>',
        type: 'type_mismatch',
        real: realObj,
        clone: cloneObj,
        severity: 'high',
        message: `Type mismatch: ${realType} vs ${cloneType}`
      });
      return differences;
    }

    // Handle arrays
    if (Array.isArray(realObj)) {
      return this.compareArrays(realObj, cloneObj, path, ignoreFields);
    }

    // Handle objects
    if (realType === 'object') {
      const allKeys = new Set([
        ...Object.keys(realObj),
        ...Object.keys(cloneObj)
      ]);

      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;

        // Skip ignored fields
        if (this.shouldIgnoreField(currentPath, key, ignoreFields)) {
          continue;
        }

        const realValue = realObj[key];
        const cloneValue = cloneObj[key];

        // Missing key
        if (!(key in realObj)) {
          differences.push({
            path: currentPath,
            type: 'missing_in_real',
            real: undefined,
            clone: cloneValue,
            severity: 'medium',
            message: `Missing in Real: ${key}`
          });
          continue;
        }

        if (!(key in cloneObj)) {
          differences.push({
            path: currentPath,
            type: 'missing_in_clone',
            real: realValue,
            clone: undefined,
            severity: 'medium',
            message: `Missing in Clone: ${key}`
          });
          continue;
        }

        // Recursively compare nested values
        const nestedDiffs = this.compareObjects(realValue, cloneValue, currentPath, ignoreFields);
        differences.push(...nestedDiffs);
      }
    } else {
      // Primitive value comparison
      if (realObj !== cloneObj) {
        differences.push({
          path: path || '<root>',
          type: 'value_mismatch',
          real: realObj,
          clone: cloneObj,
          severity: 'high',
          message: `Value mismatch: "${realObj}" vs "${cloneObj}"`
        });
      }
    }

    return differences;
  }

  /**
   * Compare two arrays element by element
   * @param {Array} realArr - Real Gmail array
   * @param {Array} cloneArr - Clone Gmail array
   * @param {string} path - Current JSON path
   * @param {Array<string>} ignoreFields - Fields to ignore
   * @returns {Array<Object>} Array of difference objects
   */
  compareArrays(realArr, cloneArr, path, ignoreFields) {
    const differences = [];

    // Length mismatch
    if (realArr.length !== cloneArr.length) {
      differences.push({
        path: `${path}.length`,
        type: 'array_length_mismatch',
        real: realArr.length,
        clone: cloneArr.length,
        severity: 'medium',
        message: `Array length mismatch: ${realArr.length} vs ${cloneArr.length}`
      });
    }

    // Compare each element
    const maxLength = Math.max(realArr.length, cloneArr.length);
    for (let i = 0; i < maxLength; i++) {
      const elementPath = `${path}[${i}]`;
      const realElement = realArr[i];
      const cloneElement = cloneArr[i];

      if (i >= realArr.length) {
        differences.push({
          path: elementPath,
          type: 'missing_in_real',
          real: undefined,
          clone: cloneElement,
          severity: 'medium',
          message: `Element missing in Real at index ${i}`
        });
        continue;
      }

      if (i >= cloneArr.length) {
        differences.push({
          path: elementPath,
          type: 'missing_in_clone',
          real: realElement,
          clone: undefined,
          severity: 'medium',
          message: `Element missing in Clone at index ${i}`
        });
        continue;
      }

      // Recursively compare array elements
      const elementDiffs = this.compareObjects(realElement, cloneElement, elementPath, ignoreFields);
      differences.push(...elementDiffs);
    }

    return differences;
  }

  /**
   * Check if a field should be ignored during comparison
   * @param {string} fullPath - Full JSON path (e.g., "labels[0].id")
   * @param {string} fieldName - Field name (e.g., "id")
   * @param {Array<string>} ignoreFields - Fields to ignore
   * @returns {boolean} True if field should be ignored
   */
  shouldIgnoreField(fullPath, fieldName, ignoreFields) {
    // Check exact field name match
    if (ignoreFields.includes(fieldName)) {
      return true;
    }

    // Check full path match (for nested fields)
    if (ignoreFields.includes(fullPath)) {
      return true;
    }

    // Check wildcard patterns (e.g., "*.id" matches any "id" field)
    for (const pattern of ignoreFields) {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        if (regex.test(fullPath)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get type of value (handles null and arrays correctly)
   * @param {*} value - Value to check
   * @returns {string} Type name
   */
  getType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }
}
