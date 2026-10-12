import { Link } from 'react-router-dom';
import { Shield, FileText, DollarSign, HelpCircle, Trash2, Mail, Heart, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

const FooterLink = ({ to, children, icon: Icon }: {to: string;children: React.ReactNode;icon?: React.ComponentType<{className?: string;}>;}) =>
<li>
    <Link
    to={to}
    className="group text-sm text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-2">

      {Icon && <Icon className="h-3 w-3 transition-transform duration-300 group-hover:scale-110" />}
      <span className="relative">
        {children}
        <span className="absolute bottom-0 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
      </span>
    </Link>
  </li>;


const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-muted/30 to-muted/50 border-t border-border mt-auto overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 py-10 relative">
        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Legal */}
          <div className="animate-fade-in-up stagger-1" style={{ animationFillMode: 'both' }}>
            <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Legal
            </h4>
            <ul className="space-y-3">
              <FooterLink to="/terms" icon={FileText}>Terms & Conditions</FooterLink>
              <FooterLink to="/privacy-policy" icon={Shield}>Privacy Policy</FooterLink>
              <FooterLink to="/refund-policy" icon={DollarSign}>Refund Policy</FooterLink>
            </ul>
          </div>

          {/* Support */}
          <div className="animate-fade-in-up stagger-2" style={{ animationFillMode: 'both' }}>
            <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-accent rounded-full" />
              Support
            </h4>
            <ul className="space-y-3">
              <FooterLink to="/help" icon={HelpCircle}>Help Center</FooterLink>
              <FooterLink to="/contact" icon={Mail}>Contact Us</FooterLink>
              <FooterLink to="/data-deletion" icon={Trash2}>Delete My Data</FooterLink>
            </ul>
          </div>

          {/* Company */}
          <div className="animate-fade-in-up stagger-3" style={{ animationFillMode: 'both' }}>
            <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full" />
              Company
            </h4>
            <ul className="space-y-3">
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/mentor-info">Become a Mentor</FooterLink>
            </ul>
          </div>

          {/* Contact */}
          <div className="animate-fade-in-up stagger-4" style={{ animationFillMode: 'both' }}>
            <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full" />
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href="mailto:mentsol123@gmail.com"
                  className="hover:text-primary transition-colors duration-300 flex items-center gap-2 group">

                  <Mail className="h-3 w-3 transition-transform group-hover:scale-110" />
                  mentsol123@gmail.com
                </a>
              </li>
              <li>
                


              </li>
              <li className="text-xs leading-relaxed pt-1 text-muted-foreground/80">
                MentSol<br />
                Mumbai, Maharashtra, India
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative border-t border-border/50 pt-6">
          {/* Gradient line on border */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  MentSol
                </span>
                <Sparkles className="absolute -top-1 -right-4 h-3 w-3 text-primary animate-pulse" />
              </div>
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                v1.0.0
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              © {currentYear} MentSol. All rights reserved.
            </p>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-red-500 animate-pulse fill-red-500" />
              <span>in India</span>
            </div>
          </div>
        </div>
      </div>
    </footer>);

};

export default Footer;