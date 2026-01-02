import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
}

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-valider-commande',
  imports: [
    CommonModule, RouterModule, FormsModule, RouterLink
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './valider-commande.component.html',
  styleUrl: './valider-commande.component.css'
})
export class ValiderCommandeComponent implements OnInit{
  currentStep: number = 1;
  
  // Shipping Information
  shippingInfo: ShippingInfo = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Senegal'
  };

  saveShippingInfo: boolean = true;
  sameAsBilling: boolean = true;

  // Payment Methods
  paymentMethods: PaymentMethod[] = [
    {
      id: 'credit-card',
      name: 'Credit Card',
      icon: '💳',
      description: 'Pay securely with your credit card'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: '🅿️',
      description: 'Fast and secure payment via PayPal'
    },
    {
      id: 'mobile-money',
      name: 'Mobile Money',
      icon: '📱',
      description: 'Orange Money, Wave, Free Money'
    },
    {
      id: 'bank-transfer',
      name: 'Bank Transfer',
      icon: '🏦',
      description: 'Direct bank transfer'
    },
    {
      id: 'cash-on-delivery',
      name: 'Cash on Delivery',
      icon: '💵',
      description: 'Pay when you receive your order'
    }
  ];

  selectedPaymentMethod: string = '';
  
  // Card Information
  cardInfo = {
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  };

  // Mobile Money Information
  mobileMoneyInfo = {
    provider: 'Orange Money',
    phoneNumber: ''
  };

  // Cart Items (simulé)
  cartItems: CartItem[] = [
    {
      id: 1,
      name: 'Beauty Ultimate Eye Shadow',
      price: 113.00,
      image: 'produit1.jpg',
      quantity: 2,
      category: 'Makeup Brushes'
    },
    {
      id: 2,
      name: 'Nourishing Gold Kesar',
      price: 126.00,
      image: 'produit2.jpg',
      quantity: 1,
      category: 'Skincare Cream'
    },
    {
      id: 5,
      name: 'Yunucha Eye Liner',
      price: 86.00,
      image: 'produit5.jpg',
      quantity: 3,
      category: 'Makeup Lipstick'
    }
  ];

  

  discount: number = 20;
  couponCode: string = 'WELCOME10';

  menuItems: string[] = [
    'Hair Cream', 
    'Face Primer', 
    'Makeup Brushes', 
    'Perfumes', 
    'Skincare Cream', 
    'Makeup Lipstick', 
    'More'
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Vérifier si le panier est vide
    if (this.cartItems.length === 0) {
      this.router.navigate(['/cart']);
    }
  }
  getSelectedPaymentMethodName(): string {
  const method = this.paymentMethods.find(m => m.id === this.selectedPaymentMethod);
  return method ? method.name : '';
}

  // Calculs
  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get shipping(): number {
    return this.subtotal > 200 ? 0 : 15.00;
  }

  get tax(): number {
    return this.subtotal * 0.1;
  }

  get total(): number {
    return this.subtotal + this.shipping + this.tax - this.discount;
  }

  get cartCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Navigation entre les étapes
  goToStep(step: number): void {
    if (step === 2 && !this.validateShippingInfo()) {
      alert('Please fill in all required shipping information');
      return;
    }
    if (step === 3 && !this.selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextStep(): void {
    if (this.currentStep < 3) {
      this.goToStep(this.currentStep + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Validation
  validateShippingInfo(): boolean {
    return !!(
      this.shippingInfo.firstName &&
      this.shippingInfo.lastName &&
      this.shippingInfo.email &&
      this.shippingInfo.phone &&
      this.shippingInfo.address &&
      this.shippingInfo.city &&
      this.shippingInfo.zipCode
    );
  }

  validatePaymentInfo(): boolean {
    if (this.selectedPaymentMethod === 'credit-card') {
      return !!(
        this.cardInfo.number &&
        this.cardInfo.name &&
        this.cardInfo.expiry &&
        this.cardInfo.cvv
      );
    }
    if (this.selectedPaymentMethod === 'mobile-money') {
      return !!this.mobileMoneyInfo.phoneNumber;
    }
    return true; // Pour les autres méthodes
  }

  // Sélection du mode de paiement
  selectPaymentMethod(methodId: string): void {
    this.selectedPaymentMethod = methodId;
  }

  // Formater le numéro de carte
  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    this.cardInfo.number = formattedValue;
  }

  // Formater la date d'expiration
  formatExpiry(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    this.cardInfo.expiry = value;
  }

  // Finaliser la commande
  placeOrder(): void {
    if (!this.validateShippingInfo()) {
      alert('Please complete shipping information');
      this.goToStep(1);
      return;
    }

    if (!this.selectedPaymentMethod) {
      alert('Please select a payment method');
      this.goToStep(2);
      return;
    }

    if (!this.validatePaymentInfo()) {
      alert('Please complete payment information');
      return;
    }

    // Simuler le traitement de la commande
    const orderData = {
      shipping: this.shippingInfo,
      payment: {
        method: this.selectedPaymentMethod,
        details: this.selectedPaymentMethod === 'credit-card' ? this.cardInfo : 
                this.selectedPaymentMethod === 'mobile-money' ? this.mobileMoneyInfo : null
      },
      items: this.cartItems,
      totals: {
        subtotal: this.subtotal,
        shipping: this.shipping,
        tax: this.tax,
        discount: this.discount,
        total: this.total
      }
    };

    console.log('Order placed:', orderData);
    alert('Order placed successfully! Order #' + Math.floor(Math.random() * 100000));
    
    // Redirection vers une page de confirmation (à créer)
    // this.router.navigate(['/order-confirmation']);
    this.router.navigate(['/']);
  }

}
