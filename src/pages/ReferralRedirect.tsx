import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { logReferralClick } from '@/utils/referral';
import { Loader2 } from 'lucide-react';

const REFERRAL_STORAGE_KEY = 'mentsol_referral_code';

export default function ReferralRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      // Store referral code in localStorage
      localStorage.setItem(REFERRAL_STORAGE_KEY, code);
      console.log('Referral code stored from URL:', code);
      
      // Log click to edge function (fire and forget)
      logReferralClick(code);
      
      // Redirect to student signup
      navigate('/auth?role=student', { replace: true });
    } else {
      // No code provided, redirect to auth
      navigate('/auth', { replace: true });
    }
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
