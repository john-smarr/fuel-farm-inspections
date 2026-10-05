import React from 'react'

export default function PrivacyPolicyScreen({ onClose }) {
  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-white">Privacy Policy</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 text-sm text-gray-300 max-w-lg mx-auto w-full">
        <p className="text-xs text-gray-500">Last updated: October 2026</p>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">Overview</h3>
          <p>
            Fuel Farm Inspector is a tool for recording daily and monthly fuel farm inspections.
            Your privacy is important to us. This policy explains what data the app collects
            and how it is used.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">Data Storage</h3>
          <p className="mb-2">
            All inspection data — including facility records, asset configurations, daily and monthly
            inspection entries, and your login credentials — is stored <strong className="text-white">only on your device</strong>.
          </p>
          <p>
            No data is transmitted to any server, cloud service, or third party. The app does not
            require an internet connection to function.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">Camera</h3>
          <p>
            The app requests access to your device camera solely to scan QR codes printed on tank
            and truck labels. Camera images are not stored, transmitted, or shared.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">Login Credentials</h3>
          <p>
            Your username and password are stored locally on your device in encrypted form using
            PBKDF2 key derivation. Credentials are never transmitted off the device.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">Photos</h3>
          <p>
            Photos attached to inspection failure items are compressed and stored locally on your
            device as part of the inspection record. They are not uploaded or shared.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">Email Exports</h3>
          <p>
            When you choose to email an inspection report, the app opens your device's mail app
            with a pre-composed message. No email is sent automatically, and the app does not
            access your contacts or email account.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">Analytics &amp; Tracking</h3>
          <p>
            The app does not use any analytics, crash reporting, advertising, or tracking services.
            No data about your usage is collected or shared.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">Data Deletion</h3>
          <p>
            You can delete all app data at any time using the "Clear All Data" option in Settings.
            Uninstalling the app removes all locally stored data from your device.
          </p>
        </section>

        <section>
          <h3 className="text-base font-semibold text-white mb-2">Contact</h3>
          <p>
            If you have questions about this privacy policy, please contact your facility
            administrator or the person who provisioned this app for your organization.
          </p>
        </section>
      </div>
    </div>
  )
}
