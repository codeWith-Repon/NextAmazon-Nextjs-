import { HelpCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import CheckoutFrom from './checkout-from';

export default function CheckoutLayout({
  cheldren,
}: {
  cheldren: React.ReactNode;
}) {
  return (
    <div className='p-4'>
      <header className='bg-card mb-4 border-b'>
        <div className='max-w-6xl mx-auto flex justify-between items-center'>
          <Link href='/'>
            <Image
              src='/icons/logo.svg'
              alt='logo'
              width={70}
              height={70}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
          </Link>
          <div>
            <h1 className='text-3xl '> Checkout</h1>
          </div>
          <div>
            <Link href='/page/help'>
              <HelpCircle className='h-6 w-6' />
            </Link>
          </div>
        </div>
      </header>
      <CheckoutFrom/>
      {cheldren}
    </div>
  );
}
