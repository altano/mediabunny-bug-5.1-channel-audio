import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Input, UrlSource, ALL_FORMATS, AudioBufferSink } from 'mediabunny'

function MediaBunnyPlayer({ clipPath }) {
  const [status, setStatus] = useState('Not started')
  const [error, setError] = useState(null)
  const [result, setResult] = useState('pending') // 'pending', 'success', 'error'

  useEffect(() => {
    async function loadAudio() {
      try {
        setStatus('Creating Input...')
        console.log('Creating Input...')

        const input = new Input({
          source: new UrlSource(clipPath),
          formats: ALL_FORMATS,
        })

        setStatus('Getting audio track...')
        console.log('Getting audio track...')

        const audioTrack = await input.getPrimaryAudioTrack()
        if (!audioTrack) {
          throw new Error('No audio track found')
        }

        setStatus(`Audio track found: ${audioTrack.codec}, ${audioTrack.sampleRate}Hz`)
        console.log('Audio track:', {
          codec: audioTrack.codec,
          sampleRate: audioTrack.sampleRate,
        })

        setStatus('Creating AudioBufferSink...')
        console.log('Creating AudioBufferSink...')

        const audioSink = new AudioBufferSink(audioTrack)

        setStatus('AudioBufferSink created, starting playback...')
        console.log('AudioBufferSink created successfully')

        setStatus('Creating audio iterator...')
        console.log('Creating audio iterator...')

        const iterator = audioSink.buffers(0)

        setStatus('Calling iterator.next() for first time...')
        console.log('Calling iterator.next() for first time...')

        // BUG: This call behaves differently across browsers with 5.1 channel audio:
        // - Chrome: Works fine
        // - Firefox: Works fine
        // - Safari/WebKit: Crashes the browser tab
        const firstResult = await iterator.next()

        // This code executes successfully in Chrome and Firefox, but not in Safari
        console.log('First iterator.next() result:', {
          done: firstResult.done,
          hasValue: !!firstResult.value,
        })

        if (firstResult.value) {
          const { buffer } = firstResult.value
          console.log('First audio buffer:', {
            numberOfChannels: buffer.numberOfChannels,
            duration: buffer.duration,
            sampleRate: buffer.sampleRate,
          })
          setStatus(`Success! Got audio buffer with ${buffer.numberOfChannels} channels`)
          setResult('success')
        } else {
          setStatus('Iterator returned no value')
          setResult('error')
        }
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err.message : String(err))
        setStatus('Error occurred')
        setResult('error')
      }
    }

    loadAudio()
  }, [clipPath])

  useEffect(() => {
    const borderColor = result === 'success' ? '#4caf50' : result === 'error' ? '#f44336' : '#ccc'
    const playerElement = document.querySelector('.player')
    if (playerElement) {
      playerElement.style.borderColor = borderColor
    }
  }, [result])

  return (
    <div>
      <div className="status">
        <strong>Status:</strong> {status}
      </div>
      {error && (
        <div className="status error">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}

// Read clip path from data attribute on root element
const rootElement = document.getElementById('root')
const clipPath = rootElement.getAttribute('data-clip-path')

createRoot(rootElement).render(<MediaBunnyPlayer clipPath={clipPath} />)
