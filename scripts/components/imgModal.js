export class ImageModal {
  constructor() {
    this.modal = null;
    this.overlay = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    // Create modal structure
    this.modal = document.createElement('div');
    this.modal.className = 'image-modal';
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-modal', 'true');
    this.modal.setAttribute('aria-label', 'Image viewer');

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'image-modal-overlay';

    // Create modal content container
    const modalContent = document.createElement('div');
    modalContent.className = 'image-modal-content';

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'image-modal-close';
    closeButton.setAttribute('aria-label', 'Close image modal');
    closeButton.innerHTML = '&times;';

    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-modal-image-container';

    const image = document.createElement('img');
    image.className = 'image-modal-image';
    image.alt = 'Enlarged image';

    imageContainer.appendChild(image);
    modalContent.appendChild(closeButton);
    modalContent.appendChild(imageContainer);
    this.modal.appendChild(modalContent);

    // Append to body
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.modal);

    // Store modalContent reference for click detection
    this.modalContent = modalContent;

    // Event listeners
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });
    
    // Prevent clicks on modal content from closing the modal
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Close when clicking on overlay
    this.overlay.addEventListener('click', () => this.close());
    
    // Close when clicking on modal (outside content)
    this.modal.addEventListener('click', (e) => {
      // Only close if click is directly on modal, not on content or its children
      if (e.target === this.modal) {
        this.close();
      }
    });
    
    // Close on Escape key
    this.handleKeydown = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.handleKeydown);

    // Prevent body scroll when modal is open
    this.preventBodyScroll = this.preventBodyScroll.bind(this);
    this.restoreBodyScroll = this.restoreBodyScroll.bind(this);
  }

  handleKeydown(event) {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  open(imageSrc) {
    if (!imageSrc) {
      console.error('Image source is required');
      return;
    }

    const image = this.modal.querySelector('.image-modal-image');
    image.src = imageSrc;
    image.onload = () => {
      this.modal.classList.add('active');
      this.overlay.classList.add('active');
      this.isOpen = true;
      this.preventBodyScroll();
    };
    image.onerror = () => {
      console.error('Failed to load image:', imageSrc);
    };
  }

  close() {
    if (!this.isOpen) return;

    this.modal.classList.remove('active');
    this.overlay.classList.remove('active');
    this.isOpen = false;
    this.restoreBodyScroll();
  }

  preventBodyScroll() {
    document.body.style.overflow = 'hidden';
  }

  restoreBodyScroll() {
    document.body.style.overflow = '';
  }

  destroy() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeydown);
    
    // Remove elements from DOM
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    
    this.restoreBodyScroll();
  }
}

