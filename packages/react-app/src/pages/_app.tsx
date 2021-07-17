import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import SiteLayout from '../components/global/SiteLayout'
import { Web3ReactProvider } from '@web3-react/core'
import { ethers } from 'ethers'
import { ReactElement } from 'react'

const defaultPageMeta = {
  title: 'Bankless Bounty Board',
}

function getLibrary(provider) {
  return new ethers.providers.Web3Provider(provider) // this will vary according to whether you use e.g. ethers or web3.js
}

const Web3ReactProviderDefault = dynamic(
  () => import('../providers/Web3ReactProviderDefaultSSR'),
  { ssr: false }
)

const BanklessApp = ({ Component, pageProps }: AppProps): ReactElement => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ReactProviderDefault getLibrary={getLibrary}>
        <SiteLayout pageMeta={pageProps.pageMeta || { defaultPageMeta }}>
          <Component {...pageProps} />
        </SiteLayout>
      </Web3ReactProviderDefault>
    </Web3ReactProvider>
  )
}

export default BanklessApp