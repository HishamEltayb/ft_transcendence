class DocumentHandler {
    // Helper method to find elements by ID
    getById(id) {
        return document.getElementById(id);
    }
    
    // Helper method to find elements by selector
    queryAll(selector) {
        return document.querySelectorAll(selector);
    }
    
    // Helper method to find first element matching selector
    query(selector) {
        return document.querySelector(selector);
    }
    
    getAppContainer() {
        return document.getElementById('App');
    }

    getPageSection() {
        return document.getElementById('pageSection');
    }
}

// Create a singleton instance
const docHandler = new DocumentHandler();
export default docHandler;

