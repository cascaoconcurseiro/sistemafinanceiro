/**
 * 🚀 Webpack Cache Plugin
 * Integrates smart module cache with webpack build process
 */

const { moduleCache } = require('./module-cache.ts');

class SmartCachePlugin {
  constructor(options = {}) {
    this.options = {
      enabled: process.env.NODE_ENV === 'development',
      verbose: false,
      ...options
    };
  }

  apply(compiler) {
    if (!this.options.enabled) return;

    const pluginName = 'SmartCachePlugin';

    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      // Hook into module build process
      compilation.hooks.buildModule.tap(pluginName, (module) => {
        if (module.resource && module.resource.endsWith('.ts') || module.resource.endsWith('.tsx')) {
          this.handleModuleBuild(module);
        }
      });

      // Print stats after compilation
      compilation.hooks.afterOptimizeChunks.tap(pluginName, () => {
        if (this.options.verbose) {
          moduleCache.printStats();
        }
      });
    });

    // Clean up on exit
    process.on('exit', () => {
      if (this.options.verbose) {
        console.log('\n🚀 Final Cache Statistics:');
        moduleCache.printStats();
      }
    });
  }

  handleModuleBuild(module) {
    try {
      const modulePath = module.resource;
      const dependencies = this.extractDependencies(module);
      
      // Check if we have cached version
      if (module._source && module._source._value) {
        const content = module._source._value;
        
        if (!moduleCache.needsRecompilation(modulePath, content, dependencies)) {
          const cached = moduleCache.getCachedModule(modulePath);
          if (cached) {
            // Use cached version
            module._source._value = cached;
            return;
          }
        }
      }
    } catch (error) {
      if (this.options.verbose) {
        console.warn(`Cache check failed for ${module.resource}:`, error.message);
      }
    }
  }

  extractDependencies(module) {
    const dependencies = [];
    
    if (module.dependencies) {
      for (const dep of module.dependencies) {
        if (dep.module && dep.module.resource) {
          dependencies.push(dep.module.resource);
        }
      }
    }
    
    return dependencies;
  }
}

module.exports = SmartCachePlugin;