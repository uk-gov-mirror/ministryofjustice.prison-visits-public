require 'maybe_date'
require 'email_address_validation'

class FeedbackSubmission
  include NonPersistedModel

  attribute :body, String, default: nil
  attribute :prisoner_number, String, default: nil
  attribute :prisoner_date_of_birth, MaybeDate, default: nil
  attribute :prison_id, String, default: nil
  attribute :email_address, String, default: nil
  attribute :referrer, String, default: nil
  attribute :user_agent, String, default: nil

  validates :body, presence: true
  validates :prisoner_date_of_birth, allow_blank: true, age: true
  validates :prisoner_number, allow_blank: true, prisoner_number: true
  validate :email_format

  def email_address=(val)
    stripped = val.try(:strip)
    super(stripped)
  end

private

  def email_format
    return if email_address.blank?

    email_checker = EmailAddressValidation::Checker.new(email_address)

    unless email_checker.valid?
      errors.add(:email_address, 'has incorrect format')
    end
  end
end
