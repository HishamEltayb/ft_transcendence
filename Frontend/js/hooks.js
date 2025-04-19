import { COMPONENTS, PAGES} from './constant.js';

class Hooks {

  async useFetchHtml(url, returnElement = true) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) 
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      
      const html = await response.text();
      
      const tempElement = document.createElement('div');
      tempElement.innerHTML = html;
      
      return returnElement ? tempElement.firstChild : tempElement;
    } catch (error) {
      console.error(`Error fetching HTML from ${url}:`, error);
      throw error;
    }
  }

  async useFetchAllComponents() {
    try {
      const promises = Object.entries(COMPONENTS).map(([name, url]) => 
        this.useFetchHtml(url).then(element => ({ name, element }))
      );
      
      const results = await Promise.all(promises);
      
      const components = {};
      results.forEach(result => {
        components[result.name] = result.element;
      });
      
      return components;
    } catch (error) {
      console.error(`Error fetching components:`, error);
      throw error;
    }
  }

  async useFetchAllPages() {
    try {
      const promises = Object.entries(PAGES).map(([name, url]) => 
        this.useFetchHtml(url, false).then(element => ({ name, element }))
      );
      
      const results = await Promise.all(promises);
      
      const pages = {};
      results.forEach(result => {
        pages[result.name] = result.element;
      });
      
      return pages;
    } catch (error) {
      console.error(`Error fetching pages:`, error);
      throw error;
    }
  }
}

const hooks = new Hooks();

export default hooks; 