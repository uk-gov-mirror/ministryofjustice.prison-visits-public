Rails.application.routes.draw do
  get '/', to: redirect(ENV.fetch('GOVUK_START_PAGE', '/en/request'))

  %w[ 404 500 503 ].each do |code|
    match code, to: 'errors#show', status_code: code, via: %i[ get post ]
  end
  match 'exception', to: 'errors#test', via: %i[ get post ]

  # Old pvb1 path to start a booking
  get '/prisoner', to: redirect(ENV.fetch('GOVUK_START_PAGE', '/en/request'))

  constraints format: 'json' do
    get 'ping', to: 'ping#index'
    get 'healthcheck', to: 'healthcheck#index'
  end

  # Old pvb1 link that users got in an email
  get 'status/:id', controller: :pvb1_paths, action: :status, as: :pvb1_status

  scope '/:locale', locale: /[a-z]{2}/ do
    get '/', to: redirect('/%{locale}/request')

    resources :booking_requests, path: 'request', only: %i[ index create ]
    resources :visits, only: %i[ show ]
    resources :cancellations, path: 'cancel', only: %i[ create ]
    resources :feedback_submissions, path: 'feedback', only: %i[ new create ]

    controller 'high_voltage/pages' do
      get 'cookies', action: :show, id: 'cookies'
      get 'terms-and-conditions', action: :show, id: 'terms_and_conditions'
      get 'unsubscribe', action: :show, id: 'unsubscribe'
    end
  end
end
