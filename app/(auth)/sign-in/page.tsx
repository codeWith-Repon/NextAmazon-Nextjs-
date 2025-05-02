import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Metadata } from 'next';
import React from 'react';
import CredentialsSignInForm from './credentials-signin-form';
import SeparatorWithOr from '@/components/shared/separator-or';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GoogleSignInForm } from './google-signin-form';

export const metadata: Metadata = {
  title: 'Sign In',
};
export default async function SignIn(props: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const { callbackUrl = '/' } = searchParams;

  const session = await auth();
  if (session) {
    return redirect(callbackUrl);
  }
  return (
    <div className='w-full'>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <CredentialsSignInForm />
          </div>
          <SeparatorWithOr />
          <div className='mt-4'>
            <GoogleSignInForm />
          </div>
        </CardContent>
      </Card>
      <SeparatorWithOr>New to {APP_NAME}?</SeparatorWithOr>

      <Link href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
        <Button className='w-full' variant='outline'>
          Create your {APP_NAME} account
        </Button>
      </Link>
    </div>
  );
}
