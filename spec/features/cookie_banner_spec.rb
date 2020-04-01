require 'rails_helper'

RSpec.feature 'Cookie banner', js: true do
  include FeaturesHelper

  cookie_banner_text = "This service uses cookies which are essential for the site to work. We also use non-essential cookies to help us improve your experience.\nDo you accept these non-essential cookies?\nAccept cookies Reject cookies View more information"

  scenario 'first navigating to cookies page', vcr: {
    cassette_name: :private_prison_booking
  } do
    visit booking_requests_path(locale: 'en')
    expect(page).to have_text(cookie_banner_text)
  end

  scenario 'accpeting cookies', vcr: {
    cassette_name: :private_prison_booking
  } do
    visit booking_requests_path(locale: 'en')
    click_button 'Accept cookies'
    expect(page).to_not have_text(cookie_banner_text)
  end

  scenario 'rejecting cookies', vcr: {
    cassette_name: :private_prison_booking
  } do
    visit booking_requests_path(locale: 'en')
    click_button 'Reject cookies'
    expect(page).to_not have_text(cookie_banner_text)
  end

  scenario 'accepting cookies from cookies page', vcr: {
    cassette_name: :private_prison_booking
  } do
    visit booking_requests_path(locale: 'en')
    click_on 'View more information'
    expect(page).to have_text(cookie_banner_text)
    choose(option: 'yes', visible: false)
    click_button 'Save changes'
    expect(page).to_not have_text(cookie_banner_text)
  end

  scenario 'rejecting cookies from cookies page', vcr: {
    cassette_name: :private_prison_booking
  } do
    visit booking_requests_path(locale: 'en')
    click_on 'View more information'
    expect(page).to have_text(cookie_banner_text)
    choose(option: 'yes', visible: false)
    click_button 'Save changes'
    expect(page).to_not have_text(cookie_banner_text)
  end
end
