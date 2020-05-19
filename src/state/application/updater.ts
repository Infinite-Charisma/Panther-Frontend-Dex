import { useEffect, useState } from 'react'
import { useDebounce, useWeb3React } from '../../hooks'
import { updateBlockNumber } from './actions'
import { useDispatch } from 'react-redux'

export default function Updater() {
  const { library, chainId } = useWeb3React()
  const dispatch = useDispatch()

  const [maxBlockNumber, setMaxBlockNumber] = useState<number | null>(null)
  // because blocks arrive in bunches with longer polling periods, we just want
  // to process the latest one.
  const debouncedMaxBlockNumber = useDebounce<number | null>(maxBlockNumber, 100)

  // update block number
  useEffect(() => {
    if (!library || !chainId) return

    const blockListener = (blockNumber: number) => {
      setMaxBlockNumber(maxBlockNumber => {
        if (typeof maxBlockNumber !== 'number') return blockNumber
        return Math.max(maxBlockNumber, blockNumber)
      })
    }

    setMaxBlockNumber(null)

    library
      .getBlockNumber()
      .then(blockNumber => dispatch(updateBlockNumber({ chainId, blockNumber })))
      .catch(error => console.error(`Failed to get block number for chainId ${chainId}`, error))

    library.on('block', blockListener)
    return () => {
      library.removeListener('block', blockListener)
    }
  }, [dispatch, chainId, library])

  useEffect(() => {
    if (!chainId || !debouncedMaxBlockNumber) return
    dispatch(updateBlockNumber({ chainId, blockNumber: debouncedMaxBlockNumber }))
  }, [chainId, debouncedMaxBlockNumber, dispatch])

  return null
}
