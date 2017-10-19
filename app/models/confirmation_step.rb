class ConfirmationStep
  include NonPersistedModel

  attribute :confirmed, Boolean, default: nil
  validates :confirmed, inclusion: { in: [true] }

  def options_available?
    false
  end
end
