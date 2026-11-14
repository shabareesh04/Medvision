"use client"

import * as React from "react"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import { Activity, X } from "lucide-react"
import ChatSupport from "./ChatSupport"

export default function Footerdemo() {
  const [isChatOpen, setIsChatOpen] = React.useState(false)

  return (
    <footer className="relative border-t bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <nav className="space-y-2 text-sm">
              <Link to="/" className="block transition-colors hover:text-primary">
                Home
              </Link>
              <Link to="/upload" className="block transition-colors hover:text-primary">
                Start Diagnosis
              </Link>
              <Link to="/insurance" className="block transition-colors hover:text-primary">
                Insurance Claims Portal
              </Link>
              <Link to="/search-doctor" className="block transition-colors hover:text-primary">
                Find Specialists
              </Link>
              <Link to="/contact" className="block transition-colors hover:text-primary">
                Contact Us
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Diagnostic Modalities</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Chest X-Ray & Pneumonia Analysis</p>
              <p>• Brain Tumor MRI Segmentation</p>
              <p>• Bone Fracture Detection & Trauma</p>
              <p>• Kidney Ultrasound AI Diagnostics</p>
              <p>• AI-Assisted Insurance Claims</p>
            </div>
          </div>
        </div>

      </div>
      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
      >
        {isChatOpen ? <X /> : <Activity />}
      </Button>
      {/* {isChatOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 rounded-lg border bg-background p-4 shadow-lg">
          <h4 className="mb-4 text-lg font-semibold">Live Chat</h4>
          <div className="mb-4 h-40 overflow-y-auto rounded border p-2">
            <p className="mb-2">
              <strong>Support:</strong> Hello! How can I assist you today?
            </p>
          </div>
          <form className="flex gap-2">
            <Textarea placeholder="Type your message..." className="flex-grow" />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      )} */}
      {isChatOpen && <ChatSupport />}
    </footer>
  )
}