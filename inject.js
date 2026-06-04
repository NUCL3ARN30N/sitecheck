(function() {
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (event.data.type === 'SITECHECK_RUN_JS_SCAN' && event.data.jsPropsToCheck) {
      const detected = [];
      const propsToCheck = event.data.jsPropsToCheck;

      for (const [techName, props] of Object.entries(propsToCheck)) {
        for (const prop of props) {
          try {
            // Support nested properties e.g. "React.version"
            const parts = prop.split('.');
            let current = window;
            for (const part of parts) {
              if (current == null) { current = undefined; break; }
              current = current[part];
            }
            if (current !== undefined) {
              detected.push({ name: techName });
              break;
            }
          } catch(e) {}
        }
      }

      window.postMessage({
        type: 'SITECHECK_JS_DATA',
        detected: detected
      }, '*');
    }
  });
})();
