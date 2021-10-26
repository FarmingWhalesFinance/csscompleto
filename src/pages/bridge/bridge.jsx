import React, { useState, useEffect } from 'react'
import classnames from 'classnames'
import { useEthers } from '@usedapp/core'
import { utils } from 'ethers'

import {
  Bridge as BridgeSyled,
  BridgeTitle,
  BridgeTitleCenter,
  BridgeCard,
  BridgeCardCol,
  BridgeInputContainer,
  BridgeCardNetworks,
  BridgeCardNetwork,
  BridgeCardLabel,
  BridgeCardLabelName,
  BridgeCardLabelValue,
  BridgeCardNetworkValue,
  BridgeButton,
  BridgeInput,
  BridgeInputError,
  ErrorMessage,
} from './bridge.module.scss'
import { MainLayout, Title, Button, Input, TxLoader } from '../../components'
import {
  getBalanceAndAllowance,
  approve,
  bridge,
} from '../../services/bridge/BridgeService'
import { switchNetwork } from '../../utils/switchNetwork'

const networks = {
  from: { symbol: 'ETH', name: 'Ethereum mainnet' },
  to: { symbol: 'BSC', name: 'Binance Smart Chain' },
}

export function Bridge() {
  const { chainId } = useEthers()
  const [bridgeValue, setBridgeValue] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)
  const [balance, setBalance] = useState(0)
  const [allowance, setAllowance] = useState(0)
  const [insufficientAllowance, setInsufficientAllowanc] = useState(false)
  const [loaderIsVisible, setLoaderIsVisible] = useState(false)
  const [txHash, setTxHash] = useState()
  const [txErrorMessage, setTxErrorMessage] = useState()

  const InputClassNames = classnames(BridgeInput, {
    [BridgeInputError]: !!errorMessage,
  })

  const fetchData = () => {
    getBalanceAndAllowance()
      .then((res) => {
        const { tokensBalance, allowance } = res
        if (res) {
          setBalance(tokensBalance)
          setAllowance(allowance)
        }
      })
      .catch((err) => console.log(err))
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Input validation
  useEffect(() => {
    if (bridgeValue === '') {
      setErrorMessage(null)
      return
    }

    const value = Number(bridgeValue)
    setInsufficientAllowanc(false)

    if (isNaN(value) || value <= 0) {
      setErrorMessage('Value must be a number bigger than 0')
      return
    }

    if (value > utils.formatUnits(String(balance), 18)) {
      setErrorMessage('Insufficient funds')
      return
    }

    if (value > utils.formatUnits(String(allowance), 18)) {
      setErrorMessage('Not enough allowance. Please approve first.')
      setInsufficientAllowanc(true)
      return
    }

    setErrorMessage(null)
  }, [bridgeValue, balance, allowance])

  if (chainId !== 1 && chainId !== 1337) {
    return (
      <MainLayout title="Bridge" noHandleNetwork>
        <div className={BridgeSyled}>
          <Title level={2} className={BridgeTitleCenter}>
            Only Mainnet support
          </Title>
          <Button onClick={() => switchNetwork(1)} className={BridgeButton}>
            Switch To Mainnet
          </Button>
        </div>
      </MainLayout>
    )
  }

  const bridgeValueHandler = (e) => {
    e.preventDefault()
    setBridgeValue(e.target.value)
  }

  const approveHandler = () => {
    if (loaderIsVisible) {
      return
    }

    setTxHash(null)
    setTxErrorMessage(null)
    setLoaderIsVisible(true)

    approve()
      .then((tx) => {
        setTxHash(tx.hash)

        tx.wait()
          .then(() => {
            fetchData()
            setLoaderIsVisible(false)
          })
          .catch((err) => {
            setTxHash(null)
            setTxErrorMessage(String(err))
            setLoaderIsVisible(false)
          })
      })
      .catch((err) => {
        setTxErrorMessage(String(err.message))
        setLoaderIsVisible(false)
        console.log(err)
      })
  }

  const bridgeHandler = () => {
    if (!!errorMessage || !bridgeValue) {
      return
    }

    const sendValue = utils.parseUnits(String(bridgeValue), 18)
    setTxHash(null)
    setTxErrorMessage(null)
    setLoaderIsVisible(true)

    bridge(sendValue)
      .then((tx) => {
        setTxHash(tx.hash)

        tx.wait()
          .then(() => {
            setLoaderIsVisible(false)
            fetchData()
          })
          .catch((err) => setTxErrorMessage(String(err)))
      })
      .catch((err) => {
        setTxErrorMessage(String(err.message))
        console.log(err)
      })
  }

  return (
    <MainLayout title="Bridge">
      <div className={BridgeSyled}>
        <Title level={2} className={BridgeTitle}>
          ETH to BSC bridge
        </Title>
        <div className={BridgeCard}>
          <div className={BridgeCardCol}>
            <div className={BridgeInputContainer}>
              <div className={BridgeCardLabel}>
                <div className={BridgeCardLabelName}>Balance:</div>
                <div className={BridgeCardLabelValue}>
                  {utils.formatUnits(balance, 18)}
                </div>
              </div>
              <Input
                type="text"
                placeholder="Enter amount"
                onChange={bridgeValueHandler}
                value={bridgeValue}
                className={InputClassNames}
              />
              <div className={ErrorMessage}>{errorMessage}</div>
            </div>
          </div>

          <div className={BridgeCardCol}>
            <div className={BridgeCardNetworks}>
              <div className={BridgeCardNetwork}>
                <div className={BridgeCardLabel}>
                  <div className={BridgeCardLabelName}>From:</div>
                  <div className={BridgeCardLabelValue}>
                    {networks.from.name}
                  </div>
                </div>
                <div className={BridgeCardNetworkValue}>
                  {networks.from.symbol}
                </div>
              </div>

              <div className={BridgeCardNetwork}>
                <div className={BridgeCardLabel}>
                  <div className={BridgeCardLabelName}>To:</div>
                  <div className={BridgeCardLabelValue}>{networks.to.name}</div>
                </div>
                <div className={BridgeCardNetworkValue}>
                  {networks.to.symbol}
                </div>
              </div>
            </div>
          </div>
        </div>

        {insufficientAllowance ? (
          <Button
            onClick={approveHandler}
            className={BridgeButton}
            disabled={loaderIsVisible}
          >
            Approve
          </Button>
        ) : (
          <Button
            onClick={bridgeHandler}
            className={BridgeButton}
            disabled={!!errorMessage || !bridgeValue || loaderIsVisible}
          >
            Bridge
          </Button>
        )}

        {loaderIsVisible && (
          <TxLoader
            txHash={txHash}
            closeHandler={() => setLoaderIsVisible(false)}
            errorMessage={txErrorMessage}
          />
        )}
      </div>
    </MainLayout>
  )
}
