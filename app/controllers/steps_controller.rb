class StepsController < ApplicationController
  helper FormElementsHelper

  def index
    @prisoner_step = PrisonerStep.new
    render :prisoner
  end

  def create
    select_step
  end

private

  def select_step
    if prisoner_step_needed?
      render :prisoner
    elsif visitors_step_needed?
      render :visitors
    elsif slots_step_needed?
      render :slots
    elsif confirmation_step_needed?
      render :confirmation
    else
      render :completed
    end
  end

  def prisoner_step_needed?
    @prisoner_step, needed =
      load_step(PrisonerStep, :prisoner_step)
    needed
  end

  def visitors_step_needed?
    @visitors_step, needed =
      load_step(VisitorsStep, :visitors_step)
    needed
  end

  def slots_step_needed?
    @slots_step, needed =
      load_step(SlotsStep, :slots_step, prison: @prisoner_step.prison)
    needed
  end

  def confirmation_step_needed?
    @confirmation_step, needed =
      load_step(ConfirmationStep, :confirmation_step)
    needed
  end

  def load_step(klass, name, additional_params = {})
    if params.key?(name)
      step = klass.new(params[name].merge(additional_params))
      needed = !step.valid?
    else
      step = klass.new(additional_params)
      needed = true
    end

    [step, needed]
  end
end
